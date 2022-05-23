import os
from apify_client import ApifyClient


# Run the main function of the script, if the script is executed directly
if __name__ == '__main__':
    # Initialize the main ApifyClient instance
    client = ApifyClient(os.environ['APIFY_TOKEN'], api_url=os.environ['APIFY_API_BASE_URL'])

    # Get the resource subclient for working with the default key-value store of the actor
    default_kv_store_client = client.key_value_store(os.environ['APIFY_DEFAULT_KEY_VALUE_STORE_ID'])

    # Get the value of the actor input and print it
    print('Loading input')
    actor_input = default_kv_store_client.get_record(os.environ['APIFY_INPUT_KEY'])['value']

    # Structure of input is defined in INPUT_SCHEMA.json
    print(f'First number: {actor_input["first_number"]}')
    print(f'Second number: {actor_input["second_number"]}')

    # 👉 Complete the code so that result is
    # the sum of first_number and second_number.
    # 👇👇👇👇👇👇👇👇👇👇
    result = None
    # 👆👆👆👆👆👆👆👆👆👆

    print(f'The result is: {result}')

    # Get the resource subclient for working with the default dataset of the actor
    default_dataset_client = client.dataset(os.environ['APIFY_DEFAULT_DATASET_ID'])

    # Structure of output is defined in .actor/actor.json
    default_dataset_client.push_items([
        {
            'first_number': actor_input["first_number"],
            'second_number': actor_input["second_number"],
            'sum': result
        },
    ])
