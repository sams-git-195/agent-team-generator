# {{project.name}} — Product Documentation

Plain-English descriptions of every page and feature. Updated by whoever makes the change,
before any feature is marked Done. Accepted minor issues: [known-issues.md](known-issues.md).
If code and these docs disagree, the code is right — fix the doc and note what drifted.

## Pages
| Page | Route | One-liner |
|---|---|---|
{{#pages}}
| [{{name}}](pages/{{file}}.md) | `{{route}}` | {{one_liner}} |
{{/pages}}
{{^pages}}
| *(none documented yet)* | | |
{{/pages}}

## Features
| Feature | One-liner | Pages involved |
|---|---|---|
| *(none documented yet)* | | |
