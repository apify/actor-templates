import json
import os

from apify_client import ApifyClient


# Run the main function of the script, if the script is executed directly
if __name__ == '__main__':
    # Initialize the main ApifyClient instance
    client = ApifyClient(os.environ['APIFY_TOKEN'])

    # Get the resource subclient for working with the default key-value store of the actor
    default_kv_store_client = client.key_value_store(os.environ['APIFY_DEFAULT_KEY_VALUE_STORE_ID'])

    # Get the value of the actor input and print it
    actor_input = default_kv_store_client.get_record(os.environ['APIFY_INPUT_KEY'])['value']
    print('Actor input:')
    print(json.dumps(actor_input, indent=2))

    # Set the 'OUTPUT' key-value store record to the same value as the input
    default_kv_store_client.set_record('OUTPUT', actor_input)

    # Get the resource subclient for working with the default dataset of the actor
    default_dataset_client = client.dataset(os.environ['APIFY_DEFAULT_DATASET_ID'])

    # Push some dummy items to the default dataset
    default_dataset_client.push_items([
        {'column1': 'dummy1a', 'column2': 'dummy2a'},
        {'column1': 'dummy1b', 'column2': 'dummy2b'},
    ])
