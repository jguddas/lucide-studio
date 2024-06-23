import { ChevronLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";
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
} from "../ui/form";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";

const newIconChecklistStepSchema = z.object({
  useCase: z.string().optional(),
  isNotBrandIcon: z.boolean().optional(),
  isNotHateSymbol: z.boolean().optional(),
  isNotReligiousSymbol: z.boolean().optional(),
  iHaveReadTheContributionGuidelines: z.boolean().optional(),
  iHaveCheckedIfThereWasAnExistingPRThatSolvesTheSameIssue: z
    .boolean()
    .optional(),
});

export type FormStepNewIconChecklistData = z.infer<
  typeof newIconChecklistStepSchema
>;

export type FormStepNewIconChecklistProps = {
  onSubmit: (data: FormStepNewIconChecklistData) => void;
  onBack: () => void;
  isPending: boolean;
  defaultValues?: Partial<FormStepNewIconChecklistData> & Record<string, any>;
};

export const FormStepNewIconChecklist = ({
  onSubmit,
  onBack,
  isPending,
  defaultValues,
}: FormStepNewIconChecklistProps) => {
  const newIconChecklistStepForm = useForm<
    z.infer<typeof newIconChecklistStepSchema>
  >({
    resolver: zodResolver(newIconChecklistStepSchema),
    defaultValues,
  });
  return (
    <Form {...newIconChecklistStepForm}>
      <form
        key="new-checklist"
        onSubmit={newIconChecklistStepForm.handleSubmit(onSubmit)}
        className="space-y-3"
      >
        <FormField
          control={newIconChecklistStepForm.control}
          name="useCase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Icon Use case<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea {...field} aria-required />
              </FormControl>
              <FormDescription>
                What is the purpose of this icon? For each icon added, please
                insert at least two real life use cases (the more the better).
                Text like &quot;it&apos;s a car icon&quot; is not accepted.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={newIconChecklistStepForm.control}
          name="isNotReligiousSymbol"
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
                I have not used any hate symbols.
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={newIconChecklistStepForm.control}
          name="isNotBrandIcon"
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
                I have not added any a brand or logo icon.
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={newIconChecklistStepForm.control}
          name="isNotHateSymbol"
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
                I have not included any religious or political imagery.
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={newIconChecklistStepForm.control}
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
                <Button asChild variant="link" className="p-0 h-[unset]">
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
        <FormMessage>
          {newIconChecklistStepForm.formState.errors.root?.serverError.message}
        </FormMessage>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            className="gap-1.5"
            disabled={isPending}
          >
            <ChevronLeftIcon />
            Back
          </Button>
          <Button disabled={isPending}>
            <span className="flex items-center gap-1.5">
              Continue in GitHub
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <ExternalLinkIcon />
              )}
            </span>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
