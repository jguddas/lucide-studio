import { ChevronLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";

const updateIconChecklistStepSchema = z.object({
  description: z.string().optional(),
  iHaveReadTheContributionGuidelines: z.boolean().optional(),
});

export type FormStepUpdateIconChecklistData = z.infer<
  typeof updateIconChecklistStepSchema
>;

export type FormStepUpdateIconChecklistProps = {
  onSubmit: (data: FormStepUpdateIconChecklistData) => void;
  onBack: () => void;
  isPending: boolean;
  defaultValues?: Partial<FormStepUpdateIconChecklistData> &
    Record<string, any>;
};

export const FormStepUpdateIconChecklist = ({
  onSubmit,
  onBack,
  isPending,
  defaultValues,
}: FormStepUpdateIconChecklistProps) => {
  const updateIconChecklistStepForm = useForm<
    z.infer<typeof updateIconChecklistStepSchema>
  >({
    resolver: zodResolver(updateIconChecklistStepSchema),
    defaultValues,
  });
  return (
    <Form {...updateIconChecklistStepForm}>
      <form
        key="update-checklist"
        onSubmit={updateIconChecklistStepForm.handleSubmit(onSubmit)}
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
                  .
                </Button>
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormMessage>
          {
            updateIconChecklistStepForm.formState.errors.root?.serverError
              .message
          }
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
