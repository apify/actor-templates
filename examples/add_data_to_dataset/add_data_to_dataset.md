---
id: add-data-to-dataset
title: Add data to dataset
---

This example opens a dataset named `"my-cool-dataset"` and adds the URL of each request to it.
 If the dataset doesn't exist, it will be created.

{{#code}}add_data_to_dataset.js{{/code}}

Each item in this dataset will be saved to its own file in the following directory:

```bash
{PROJECT_FOLDER}/apify_storage/datasets/my-cool-dataset/
```