import { FormStepNewIconChecklistData } from "./FormStepNewIconChecklist";

const prForNewUrl = (
  data: FormStepNewIconChecklistData & { prUrl: string; name: string },
) => {
  const url = new URL(data.prUrl);

  url.searchParams.set("quick_pull", "1");

  url.searchParams.set(
    "body",
    `
<!-- Thank you for contributing! -->

<!-- Insert \`closes #issueNumber\` here if merging this PR will resolve an existing issue -->

## What is the purpose of this pull request?
- [x] New Icon

### Description
Added new \`${data.name}\` icon.

### Icon use case
<!-- What is the purpose of this icon? For each icon added, please insert at least two real life use cases (the more the better). Text like "it's a car icon" is not accepted. -->
${data.useCase ?? ""}

### Alternative icon designs
<!-- If you have any alternative icon designs, please attach them here. -->

## Icon Design Checklist

### Concept
<!-- All of these requirements must be fulfilled. -->
- [${
      data.useCase?.trim() ? "x" : " "
    }] I have provided valid use cases for each icon.
- [${
      data.isNotBrandIcon ? "x" : " "
    }] I have not added any a brand or logo icon.
- [${data.isNotHateSymbol ? "x" : " "}] I have not used any hate symbols.
- [${
      data.isNotReligiousSymbol ? "x" : " "
    }] I have not included any religious or political imagery.

### Author, credits & license
<!-- Please choose one of the following, and put an "x" next to it. -->
- [ ] The icons are solely my own creation.
- [ ] The icons were originally created in #<issueNumber> by @<githubUser>
- [ ] I've based them on the following Lucide icons: <!-- provide the list of icons -->
- [ ] I've based them on the following design: <!-- provide source URL and license permitting use -->

### Naming
<!-- All of these requirements must be fulfilled. -->
- [x] I've read and followed the [naming conventions](https://lucide.dev/guide/design/icon-design-guide#naming-conventions)
- [x] I've named icons by what they are rather than their use case.
- [x] I've provided meta JSON files in \`icons\/[iconName].json\`.

### Design
<!-- All of these requirements must be fulfilled. -->
- [ ] I've read and followed the [icon design guidelines](https://lucide.dev/guide/design/icon-design-guide)
- [ ] I've made sure that the icons look sharp on low DPI displays.
- [ ] I've made sure that the icons look consistent with the icon set in size, optical volume and density.
- [ ] I've made sure that the icons are visually centered.
- [ ] I've correctly optimized all icons to three points of precision.

## Before Submitting
- [${
      data.iHaveReadTheContributionGuidelines ? "x" : " "
    }] I've read the [Contribution Guidelines](https://github.com/lucide-icons/lucide/blob/main/CONTRIBUTING.md).
- [ ] I've checked if there was an existing PR that solves the same issue.
    `.trim(),
  );

  return url;
};

export default prForNewUrl;
