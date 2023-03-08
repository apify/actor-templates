# Define your item pipelines here
#
# See: http://doc.scrapy.org/en/latest/topics/item-pipeline.html

from apify import Actor
from itemadapter import ItemAdapter


# Used to output the items into the actor's default dataset
# Enabled only when the project is run as an actor
class ActorDatasetPushPipeline:
    async def process_item(self, item, spider):
        item_dict = ItemAdapter(item).asdict()
        await Actor.push_data(item_dict)
        return item
