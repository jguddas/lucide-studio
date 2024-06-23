import { GitPullRequestCreateArrowIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useQueryState } from "next-usequerystate";
import { useState } from "react";
import { FormStepNames, FormStepNamesData } from "./FormStepNames";
import { FormStepMetadata, FormStepMetadataData } from "./FormStepMetadata";
import {
  FormStepUpdateIconChecklist,
  FormStepUpdateIconChecklistData,
} from "./FormStepUpdateIconChecklist";
import { signIn, useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import prForUpdateUrl from "./pr-for-update-url";

type Step =
  | {
      step: "name";
      data: Partial<
        FormStepNamesData &
          FormStepMetadataData &
          FormStepUpdateIconChecklistData
      >;
    }
  | {
      step: "metadata";
      data: FormStepNamesData &
        Partial<FormStepMetadataData & FormStepUpdateIconChecklistData>;
    }
  | {
      step: "update-checklist";
      data: FormStepNamesData &
        FormStepMetadataData & {
          prUrl: string;
        } & Partial<FormStepUpdateIconChecklistData>;
    };

const ContributionDialog = ({ value }: { value: string }) => {
  const session = useSession();
  const [name, setName] = useQueryState("name", { defaultValue: "" });
  const [step, setStep] = useState<Step>({ step: "name", data: { name } });
  const [open, _setOpen] = useQueryState("dialog", {
    defaultValue: false,
    parse: (query) => query === "true",
  });

  const setOpen = (value: boolean) => {
    if (value) {
      setStep(({ data }) => ({ step: "name", data }));
    }
    _setOpen(value);
  };

  const { mutateAsync: onSubmitNames, isPending: isPendingNames } = useMutation(
    {
      mutationFn: async (variables: FormStepNamesData) => {
        if (!session.data?.user) {
          await signIn("github");
          return;
        }

        return (await fetch(`/api/metadata/${variables.name}`)).json();
      },
      onSuccess: async (data, variables) => {
        setStep({
          step: "metadata",
          data: {
            categories: data?.categories?.join("\n") || "",
            tags: data?.tags?.join("\n") || "",
            contributors: [
              ...(data?.contributors || []),
              JSON.parse(session.data?.user?.image || "").login,
            ]
              .map((val) => val.trim())
              .filter((val, idx, arr) => val && arr.indexOf(val) === idx)
              .filter(Boolean)
              .join("\n"),
            ...(variables.name === step.data.name ? step.data : {}),
            ...variables,
          },
        });
      },
      onError: (_, variables) => {
        setStep({
          step: "metadata",
          data: {
            contributors: JSON.parse(session.data?.user?.image || "").login,
            ...(variables.name === step.data.name ? step.data : {}),
            ...variables,
          },
        });
      },
    },
  );

  const { mutateAsync: onSubmitMetadata, isPending: isPendingSubmitMetadata } =
    useMutation({
      mutationFn: async (variables: FormStepMetadataData) => {
        if (!session.data?.user) {
          await signIn("github");
          return;
        }
        const fetchQuery = fetch("/api/submit", {
          method: "POST",
          body: JSON.stringify({
            ...step.data,
            ...variables,
            contributors: variables.contributors
              .split("\n")
              .map((val) => val.trim()),
            tags: variables.tags.split("\n").map((val) => val.trim()),
            categories: variables.categories
              .split("\n")
              .map((val) => val.trim()),
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
      onSuccess: async (res, variables) => {
        if (step.step !== "metadata") throw new Error("Invalid step");
        if (!res) {
          throw new Error("/submit returned an empty response.");
        }
        const { pullRequestCreationUrl, pullRequestExistingUrl, isNewIcon } =
          await res?.json();
        const url = new URL(pullRequestExistingUrl || pullRequestCreationUrl);
        if (pullRequestExistingUrl || isNewIcon) {
          global?.window.open(url, "_blank");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setOpen(false);
          return;
        }
        setStep({
          step: "update-checklist",
          data: { ...step.data, ...variables, prUrl: url.toString() },
        });
      },
      onError: (error: Error) => {
        alert(error.message || "An error occurred while submitting the form.");
      },
    });

  const onSubmitUpdateIconChecklist = async (
    variables: FormStepUpdateIconChecklistData,
  ) => {
    if (step.step !== "update-checklist") throw new Error("Invalid step");
    global?.window.open(
      prForUpdateUrl({ ...step.data, ...variables }),
      "_blank",
    );
    setOpen(false);
  };

  const isPending = isPendingNames || isPendingSubmitMetadata;
  console.log(step);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5" variant="github">
          <GitPullRequestCreateArrowIcon />
          Create Pull Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute to Lucide</DialogTitle>
          <DialogDescription>
            Suggest changes or additions to Lucide.
          </DialogDescription>
        </DialogHeader>
        {step.step === "name" ? (
          <FormStepNames
            defaultValues={step.data}
            onSubmit={onSubmitNames}
            isPending={isPending}
            onChange={({ name }) => name && setName(name)}
          />
        ) : step.step === "metadata" ? (
          <FormStepMetadata
            defaultValues={step.data}
            onBack={() => {
              setStep({ step: "name", data: step.data });
            }}
            onSubmit={onSubmitMetadata}
            isPending={isPending}
          />
        ) : (
          <FormStepUpdateIconChecklist
            defaultValues={step.data}
            onBack={() => setStep({ step: "metadata", data: step.data })}
            onSubmit={onSubmitUpdateIconChecklist}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

ContributionDialog.displayName = "ContributionDialog";
export default ContributionDialog;
