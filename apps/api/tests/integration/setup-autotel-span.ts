import { init } from "autotel"
import { SimpleSpanProcessor } from "autotel/processors"
import { TestSpanCollector } from "autotel/test-span-collector"

const collector = new TestSpanCollector()

init({
  service: "money-transfer-effect",
  spanProcessors: [new SimpleSpanProcessor(collector)]
})

export function getCollector(): TestSpanCollector {
  return collector
}
