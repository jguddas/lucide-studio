import { FormStepUpdateIconChecklistData } from "./FormStepUpdateIconChecklist";

const prForUpdateUrl = (
  data: FormStepUpdateIconChecklistData & { prUrl: string },
) => {
  const url = new URL(data.prUrl);

  url.searchParams.set("quick_pull", "1");

  url.searchParams.set(
    "body",
    `
<!-- Thank you for contributing! -->

<!-- Insert \`closes #issueNumber\` here if merging this PR will resolve an existing issue -->

## What is the purpose of this pull request?
- [x] Other: Icon update

### Description
${data.description}

## Before Submitting
- [${
      data.iHaveReadTheContributionGuidelines ? "x" : " "
    }] I've read the [Contribution Guidelines](https://github.com/lucide-icons/lucide/blob/main/CONTRIBUTING.md).
- [${
      data.iHaveCheckedIfThereWasAnExistingPRThatSolvesTheSameIssue ? "x" : " "
    }] I've checked if there was an existing PR that solves the same issue.
    `.trim(),
  );

  return url;
};

export default prForUpdateUrl;
