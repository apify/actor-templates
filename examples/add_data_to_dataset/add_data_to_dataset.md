---
id: add-data-to-dataset
title: Add data to dataset
---

This example saves data to the default dataset. If the dataset doesn't exist, it will be created.
You can save data to custom datasets by using [`Apify.openDataset()`](../api/apify#opendataset)

{{#code}}add_data_to_dataset.js{{/code}}

Each item in this dataset will be saved to its own file in the following directory:

```bash
{PROJECT_FOLDER}/apify_storage/datasets/default/
```
