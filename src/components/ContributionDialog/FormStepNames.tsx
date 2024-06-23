import { ChevronRightIcon, LogInIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";
import { useQueryState } from "next-usequerystate";
import { Input } from "../ui/input";
import { useSession } from "next-auth/react";
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
import { useEffect } from "react";

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

export type FormStepNamesData = z.infer<typeof nameStepSchema>;

type FormStepNamesProps = {
  onSubmit: (data: FormStepNamesData) => void;
  onChange?: (data: Partial<FormStepNamesData>) => void;
  isPending: boolean;
  defaultValues: Partial<FormStepNamesData> & Record<string, any>;
};

export const FormStepNames = ({
  onSubmit,
  onChange,
  isPending,
  defaultValues,
}: FormStepNamesProps) => {
  const session = useSession();
  const nameStepForm = useForm<z.infer<typeof nameStepSchema>>({
    resolver: zodResolver(nameStepSchema),
    defaultValues,
  });

  const watch = nameStepForm.watch;
  useEffect(() => {
    onChange && watch(onChange);
  }, [watch, onChange]);

  return (
    <Form {...nameStepForm}>
      <form
        onSubmit={nameStepForm.handleSubmit((vars) => onSubmit(vars))}
        className="space-y-3"
      >
        <FormField
          control={nameStepForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Icon name<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  aria-required
                  onChange={(e) =>
                    field.onChange(
                      e.target.value.toLowerCase().replace(/[^\w]+/g, "-"),
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
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : session?.data ? (
              <ChevronRightIcon />
            ) : (
              <LogInIcon />
            )}
            {session?.data ? "Next" : "Sign in with GitHub"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
