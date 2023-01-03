import asyncio

from apify import Actor


async def main():
    async with Actor() as actor:
        # Get the value of the actor input
        actor_input = await actor.get_input()

        # Structure of input is defined in INPUT_SCHEMA.json
        print(f'First number: {actor_input["first_number"]}')
        print(f'Second number: {actor_input["second_number"]}')

        # 👉 Complete the code so that result is
        # the sum of first_number and second_number.
        # 👇👇👇👇👇👇👇👇👇👇
        result = None
        # 👆👆👆👆👆👆👆👆👆👆

        print(f'The result is: {result}')

        # Structure of output is defined in .actor/actor.json
        await actor.push_data([
            {
                'first_number': actor_input["first_number"],
                'second_number': actor_input["second_number"],
                'sum': result
            },
        ])

# Run the main function of the script, if the script is executed directly
if __name__ == '__main__':
    asyncio.run(main())
