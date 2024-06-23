import { ChevronLeftIcon, ArrowBigUpDashIcon } from "lucide-react";
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
import { Badge } from "../ui/badge";
import { TagInput } from "./TagInput";
import categoryOptions from "./category-options";
import { Checkbox } from "../ui/checkbox";
import { useSession } from "next-auth/react";
import { tagStringToArray } from "./tag-string-to-array";

const metadataStepSchema = z.object({
  categories: z.string().nonempty("Categories are required."),
  tags: z.string().nonempty("Tags are required."),
  contributors: z.string().nonempty("Contributors are required."),
});

export type FormStepMetadataData = z.infer<typeof metadataStepSchema>;

type FormMetadataStepProps = {
  onSubmit: (data: z.infer<typeof metadataStepSchema>) => void;
  onBack: () => void;
  defaultValues: Partial<FormStepMetadataData> & Record<string, any>;
  isPending: boolean;
};

export const FormStepMetadata = ({
  onSubmit,
  defaultValues,
  onBack,
  isPending,
}: FormMetadataStepProps) => {
  const session = useSession();
  const metadataStepForm = useForm<z.infer<typeof metadataStepSchema>>({
    resolver: zodResolver(metadataStepSchema),
    defaultValues,
  });
  const userName = JSON.parse(session.data?.user?.image || "{}").login;
  return (
    <Form {...metadataStepForm}>
      <form
        onSubmit={metadataStepForm.handleSubmit(onSubmit)}
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
                <TagInput
                  {...field}
                  placeholder="Add one tag per line."
                  onChange={(e) => field.onChange(e.target.value.toLowerCase())}
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
                <TagInput
                  {...field}
                  placeholder="Add one category per line."
                  onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                  aria-required
                >
                  {tagStringToArray(field.value).map((category) => {
                    const option = categoryOptions.find(
                      (opt) => opt.value === category,
                    );

                    if (!option)
                      return (
                        <Badge key={category} variant="destructive">
                          {category}
                        </Badge>
                      );

                    const Icon = option?.icon;
                    return (
                      <Badge key={category} className="gap-1" variant="outline">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </Badge>
                    );
                  })}
                </TagInput>
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
                <TagInput
                  {...field}
                  aria-required
                  placeholder="Add one contributor per line."
                >
                  {tagStringToArray(field.value).map((contributor) => {
                    return (
                      <Badge
                        key={contributor}
                        className="gap-1 pl-1"
                        variant="outline"
                      >
                        <img
                          className="rounded-full h-4"
                          src={`https://github.com/${contributor}.png?size=32`}
                          alt="[Unknown]"
                          aria-hidden
                        />
                        {contributor}
                      </Badge>
                    );
                  })}
                </TagInput>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={metadataStepForm.control}
          name="contributors"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  aria-required
                  checked={tagStringToArray(field.value).includes(userName)}
                  onCheckedChange={(value) =>
                    field.onChange(
                      (value
                        ? tagStringToArray(field.value).concat(userName)
                        : tagStringToArray(field.value).filter(
                            (contributor) => contributor !== userName,
                          )
                      ).join("\n"),
                    )
                  }
                />
              </FormControl>
              <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I have contributed to this SVG in a way that goes beyond
                automated changes.
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
            onClick={onBack}
            className="gap-1.5"
            disabled={isPending}
          >
            <ChevronLeftIcon />
            Back
          </Button>
          <Button disabled={isPending}>
            <span className="flex items-center gap-1.5">
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <ArrowBigUpDashIcon />
              )}
              Push
            </span>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
