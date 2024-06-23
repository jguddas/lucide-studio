import { GitForkIcon, GitPullRequestCreateArrowIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  FormStepNewIconChecklist,
  FormStepNewIconChecklistData,
} from "./FormStepNewIconChecklist";
import { signIn, useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import prForUpdateUrl from "./pr-for-update-url";
import prForNewUrl from "./pr-for-new-url";
import { cn } from "@/lib/utils";
import { tagStringToArray } from "./tag-string-to-array";

type Step =
  | {
      step: "name";
      data: Partial<
        FormStepNamesData &
          FormStepMetadataData &
          FormStepUpdateIconChecklistData &
          FormStepNewIconChecklistData
      >;
    }
  | {
      step: "fork";
      data: { forkExists: false } & Partial<
        FormStepNamesData &
          FormStepMetadataData &
          FormStepUpdateIconChecklistData &
          FormStepNewIconChecklistData
      >;
    }
  | {
      step: "metadata";
      data: FormStepNamesData &
        Partial<
          FormStepMetadataData &
            FormStepUpdateIconChecklistData &
            FormStepNewIconChecklistData
        >;
    }
  | {
      step: "update-checklist";
      data: FormStepNamesData &
        FormStepMetadataData & {
          prUrl: string;
        } & Partial<FormStepUpdateIconChecklistData>;
    }
  | {
      step: "new-checklist";
      data: FormStepNamesData &
        FormStepMetadataData & {
          prUrl: string;
        } & Partial<FormStepNewIconChecklistData>;
    };

const ContributionDialog = ({ value }: { value: string }) => {
  const session = useSession();
  const [name, setName] = useQueryState("name", { defaultValue: "" });
  const [step, setStep] = useState<Step>({
    step: "name",
    data: {
      name,
      isNotBrandIcon: true,
      isNotHateSymbol: true,
      isNotReligiousSymbol: true,
      iHaveReadTheContributionGuidelines:
        global?.window?.localStorage.getItem(
          "iHaveReadTheContributionGuidelines",
        ) === "true",
    },
  });
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
        if (step.step !== "name") throw new Error("Invalid step");
        setStep({
          step: data?.forkExists === false ? "fork" : "metadata",
          data: {
            ...data,
            categories: data?.categories?.join("\n") || "",
            tags: data?.tags?.join("\n") || "",
            contributors: data?.contributors?.join("\n") || "",
            ...(variables.name === step.data.name ? step.data : {}),
            ...variables,
          },
        });
      },
      onError: (error, variables) => {
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
            contributors: tagStringToArray(variables.contributors),
            tags: tagStringToArray(variables.tags),
            categories: tagStringToArray(variables.categories),
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
        if (pullRequestExistingUrl) {
          global?.window.open(url, "_blank");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setOpen(false);
          return;
        }
        if (isNewIcon) {
          setStep({
            step: "new-checklist",
            data: { ...step.data, ...variables, prUrl: url.toString() },
          });
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

  const onSubmitUpdateIconChecklist = (
    variables: FormStepUpdateIconChecklistData,
  ) => {
    if (step.step !== "update-checklist") throw new Error("Invalid step");
    if (variables.iHaveReadTheContributionGuidelines) {
      global?.window?.localStorage.setItem(
        "iHaveReadTheContributionGuidelines",
        "true",
      );
    }
    global?.window.open(
      prForUpdateUrl({ ...step.data, ...variables }),
      "_blank",
    );
    setOpen(false);
    setStep({ step: "name", data: { ...variables, ...step.data } });
  };

  const onSubmitNewIconChecklist = (
    variables: FormStepNewIconChecklistData,
  ) => {
    if (step.step !== "new-checklist") throw new Error("Invalid step");
    if (variables.iHaveReadTheContributionGuidelines) {
      global?.window?.localStorage.setItem(
        "iHaveReadTheContributionGuidelines",
        "true",
      );
    }
    global?.window.open(prForNewUrl({ ...step.data, ...variables }), "_blank");
    setOpen(false);
    setStep({ step: "name", data: { ...variables, ...step.data } });
  };

  const isPending = isPendingNames || isPendingSubmitMetadata;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5" variant="github">
          <GitPullRequestCreateArrowIcon />
          Create Pull Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex gap-2 -mt-1 mb-2 mr-6">
          <div
            className={cn(
              "h-2 w-full bg-primary rounded-full",
              step.step !== "name" && step.step !== "fork" && "opacity-10",
            )}
          />
          <div
            className={cn(
              "h-2 w-full bg-primary rounded-full",
              step.step !== "metadata" && "opacity-10",
            )}
          />
          <div
            className={cn(
              "h-2 w-full bg-primary rounded-full",
              step.step !== "new-checklist" &&
                step.step !== "update-checklist" &&
                "opacity-10",
            )}
          />
        </div>
        <DialogHeader>
          <DialogTitle>
            {step.step === "name" || step.step === "fork"
              ? "Publish your changes to GitHub"
              : step.step === "metadata"
                ? "Add Metadata"
                : step.step === "new-checklist"
                  ? "New Icon Pull Request Checklist"
                  : "Changed Icon Pull Request Checklist"}
          </DialogTitle>
          <DialogDescription>
            {step.step === "name"
              ? "Suggest changes or additions to Lucide."
              : step.step === "fork"
                ? "There is no fork of Lucide in your account."
                : step.step === "metadata"
                  ? "You can take a look at the existing icons for reference."
                  : "Let's fill the pull request description with the needed information."}
          </DialogDescription>
        </DialogHeader>
        {step.step === "name" ? (
          <FormStepNames
            defaultValues={step.data}
            onSubmit={onSubmitNames}
            isPending={isPending}
          />
        ) : step.step === "fork" ? (
          <DialogFooter>
            <Button
              className="gap-1.5"
              disabled={isPending}
              type="button"
              onClick={() => {
                global?.window.open(
                  "https://github.com/lucide-icons/lucide/fork",
                  "_blank",
                );
                setStep({ step: "name", data: step.data });
              }}
            >
              <GitForkIcon />
              Create Fork
            </Button>
          </DialogFooter>
        ) : step.step === "metadata" ? (
          <FormStepMetadata
            defaultValues={step.data}
            onBack={() => {
              setStep({ step: "name", data: step.data });
            }}
            onSubmit={onSubmitMetadata}
            isPending={isPending}
          />
        ) : step.step === "new-checklist" ? (
          <FormStepNewIconChecklist
            defaultValues={step.data}
            onBack={() => setStep({ step: "metadata", data: step.data })}
            onSubmit={onSubmitNewIconChecklist}
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
