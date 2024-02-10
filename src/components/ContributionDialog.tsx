import { ChevronLeftIcon, ChevronRightIcon, RocketIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useQueryState } from "next-usequerystate";
import { Input } from "./ui/input";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";

import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";

const nameStepSchema = z.object({
  name: z
    .string()
    .nonempty("Name is required.")
    .min(2, "Name must be at least 2 characters long.")
    .max(50, "Name must be between 2 and 50 characters long.")
    .regex(
      /^[a-z][a-z0-9-]*$/,
      "Name must start with a letter and contain only letters, numbers and dashes.",
    )
    .regex(/^[a-z][a-z0-9-]*[a-z]$/, "Name must not end with a number")
    .transform((value) =>
      value.toLowerCase().replaceAll("-", " ").trim().replaceAll(" ", "-"),
    ),
});

const metadataStepSchema = z.object({
  categories: z.string().nonempty("Categories are required."),
  tags: z.string().nonempty("Tags are required."),
  contributors: z.string().nonempty("Contributors are required."),
});

const updateIconChecklistStepSchema = z.object({
  description: z.string().optional(),
  iHaveReadTheContributionGuidelines: z.boolean().optional(),
  iHaveCheckedIfThereWasAnExistingPRThatSolvesTheSameIssue: z
    .boolean()
    .optional(),
});

const ContributionDialog = ({ value }: { value: string }) => {
  const [prUrl, setPrUrl] = useQueryState("pr");
  const [step, setStep] = useState<"name" | "metadata" | "update-checklist">(
    "name",
  );
  const [name, setName] = useQueryState("name", { defaultValue: "" });
  const [open, _setOpen] = useQueryState("dialog", {
    defaultValue: false,
    parse: (query) => query === "true",
  });
  const session = useSession();
  const nameStepForm = useForm<z.infer<typeof nameStepSchema>>({
    resolver: zodResolver(nameStepSchema),
    defaultValues: { name },
  });
  const metadataStepForm = useForm<z.infer<typeof metadataStepSchema>>({
    resolver: zodResolver(metadataStepSchema),
  });
  const updateIconChecklistStepForm = useForm<
    z.infer<typeof updateIconChecklistStepSchema>
  >({
    resolver: zodResolver(updateIconChecklistStepSchema),
  });
  const setOpen = (value: boolean) => {
    if (!value) {
      metadataStepForm.reset();
      updateIconChecklistStepForm.reset();
      setStep("name");
    }
    _setOpen(value);
  };

  const watch = nameStepForm.watch;

  useEffect(() => {
    const currentName = nameStepForm.getValues("name");
    if (name !== currentName) {
      nameStepForm.setValue("name", name);
    }
  }, [name, nameStepForm]);

  useEffect(() => {
    watch((values) => {
      if (values.name) {
        setName(values.name);
      }
    });
  }, [watch, setName]);

  const onOpenPrForUpdate = async (
    values: z.infer<typeof updateIconChecklistStepSchema>,
  ) => {
    if (!prUrl) return;

    const url = new URL(prUrl);

    url.searchParams.set("quick_pull", "1");

    url.searchParams.set(
      "body",
      `
<!-- Thank you for contributing! -->

<!-- Insert \`closes #issueNumber\` here if merging this PR will resolve an existing issue -->

## What is the purpose of this pull request?
- [x] Other: Icon update

### Description
${values.description}

## Before Submitting
- [${
        values.iHaveReadTheContributionGuidelines ? "x" : " "
      }] I've read the [Contribution Guidelines](https://github.com/lucide-icons/lucide/blob/main/CONTRIBUTING.md).
- [${
        values.iHaveCheckedIfThereWasAnExistingPRThatSolvesTheSameIssue
          ? "x"
          : " "
      }] I've checked if there was an existing PR that solves the same issue.
    `.trim(),
    );

    global?.window.open(url.toString(), "_blank");
    setOpen(false);
  };

  const { mutateAsync: onNameNext, isPending: isPendingNameNext } = useMutation(
    {
      mutationFn: async (values: z.infer<typeof nameStepSchema>) => {
        if (!session.data?.user) {
          await signIn("github");
          return;
        }

        return (await fetch(`/api/metadata/${values.name}`)).json();
      },
      onSuccess: async (data) => {
        if (!data) return;
        const values = metadataStepForm.getValues();
        if (!values.categories) {
          metadataStepForm.setValue("categories", data.categories.join("\n"));
        }
        if (!values.tags) {
          metadataStepForm.setValue("tags", data.tags.join("\n"));
        }
        if (!values.contributors) {
          metadataStepForm.setValue(
            "contributors",
            [
              ...data.contributors,
              JSON.parse(session.data?.user?.image || "").login,
            ]
              .filter((val, idx, arr) => val && arr.indexOf(val) === idx)
              .join("\n"),
          );
        }

        setStep("metadata");
      },
      onError: () => {
        metadataStepForm.setValue(
          "contributors",
          JSON.parse(session.data?.user?.image || "").login,
        );
        setStep("metadata");
      },
    },
  );

  const { mutateAsync: onSubmit, isPending: isPendingSubmit } = useMutation({
    mutationFn: async (
      values: z.infer<typeof nameStepSchema> &
        z.infer<typeof metadataStepSchema>,
    ) => {
      if (!session.data?.user) {
        await signIn("github");
        return;
      }
      const fetchQuery = fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          contributors: values.contributors
            .split("\n")
            .map((val) => val.trim()),
          tags: values.tags.split("\n").map((val) => val.trim()),
          categories: values.categories.split("\n").map((val) => val.trim()),
          value,
        }),
      }).then(async (res) => {
        try {
          if (!res.ok) {
            throw new Error(await res.text());
          }
        } catch (error) {
          return Promise.reject(error);
        }
        return res;
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return fetchQuery;
    },
    onSuccess: async (res) => {
      if (!res) return;
      const { pullRequestCreationUrl, pullRequestExistingUrl, isNewIcon } =
        await res?.json();
      const url = new URL(pullRequestExistingUrl || pullRequestCreationUrl);
      if (pullRequestExistingUrl || isNewIcon) {
        global?.window.open(url, "_blank");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setOpen(false);
        return;
      }
      if (prUrl !== url.toString()) {
        setPrUrl(url.toString());
      }
      if (!isNewIcon) {
        setStep("update-checklist");
      }
    },
    onError: (error: Error) => {
      metadataStepForm.setError("root.serverError", {
        type: "server",
        message:
          error.message || "An error occurred while submitting the form.",
      });
    },
  });

  const isPending = isPendingNameNext || isPendingSubmit;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          Contribute to Lucide
          <RocketIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute to Lucide</DialogTitle>
          <DialogDescription>
            Suggest changes or additions to Lucide.
          </DialogDescription>
        </DialogHeader>
        {step === "name" ? (
          <Form {...nameStepForm}>
            <form
              key="name"
              onSubmit={nameStepForm.handleSubmit((vars) => onNameNext(vars))}
              className="space-y-3"
            >
              <FormField
                control={nameStepForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        aria-required
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^\w]+/g, "-"),
                          )
                        }
                        onBlur={(e) =>
                          field.onChange(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^\w]+/g, " ")
                              .trim()
                              .replaceAll(" ", "-"),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      You need to follow the{" "}
                      <Button asChild variant="link" className="p-0">
                        <a
                          href="https://lucide.dev/guide/design/icon-design-guide#naming-conventions"
                          target="_blank"
                        >
                          naming conventions
                        </a>
                      </Button>{" "}
                      for your icon to be accepted.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormMessage>
                {nameStepForm.formState.errors.root?.serverError.message}
              </FormMessage>
              <DialogFooter>
                <Button className="gap-1.5" disabled={isPending}>
                  {session?.data ? "Next" : "Sign in with GitHub"}
                  {isPending ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <ChevronRightIcon />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : step === "metadata" ? (
          <Form {...metadataStepForm}>
            <form
              key="metadata"
              onSubmit={metadataStepForm.handleSubmit((vars) =>
                onSubmit({ ...vars, name }),
              )}
              className="space-y-3"
            >
              <FormField
                control={metadataStepForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tags<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={10}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase())
                        }
                        aria-required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={metadataStepForm.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Categories<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase())
                        }
                        aria-required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={metadataStepForm.control}
                name="contributors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contributors<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} aria-required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormMessage>
                {metadataStepForm.formState.errors.root?.serverError.message}
              </FormMessage>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("name")}
                  className="gap-1.5"
                  disabled={isPending}
                >
                  <ChevronLeftIcon />
                  Back
                </Button>
                <Button disabled={isPending}>
                  <span className="flex items-center gap-1.5">
                    Submit via GitHub
                    {isPending ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <RocketIcon />
                    )}
                  </span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...updateIconChecklistStepForm}>
            <form
              key="update-checklist"
              onSubmit={updateIconChecklistStepForm.handleSubmit((vars) =>
                onOpenPrForUpdate(vars),
              )}
              className="space-y-3"
            >
              <FormField
                control={updateIconChecklistStepForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} aria-required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateIconChecklistStepForm.control}
                name="iHaveReadTheContributionGuidelines"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        aria-required
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I have read the{" "}
                      <Button asChild variant="link" className="p-0">
                        <a
                          href="https://github.com/lucide-icons/lucide/blob/main/CONTRIBUTING.md"
                          target="_blank"
                        >
                          contribution guidelines
                        </a>
                      </Button>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateIconChecklistStepForm.control}
                name="iHaveCheckedIfThereWasAnExistingPRThatSolvesTheSameIssue"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-required
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I have checked if there was an existing PR that solves the
                      same issue
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormMessage>
                {metadataStepForm.formState.errors.root?.serverError.message}
              </FormMessage>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("metadata")}
                  className="gap-1.5"
                  disabled={isPending}
                >
                  <ChevronLeftIcon />
                  Back
                </Button>
                <Button disabled={isPending}>
                  <span className="flex items-center gap-1.5">
                    Create Pull Request
                    {isPending ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <RocketIcon />
                    )}
                  </span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

ContributionDialog.displayName = "ContributionDialog";
export default ContributionDialog;
