import * as Resource from "@effect/opentelemetry/Resource"
import * as Tracer from "@effect/opentelemetry/Tracer"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

export const AutotelEffectLive = pipe(
  Tracer.layerGlobal,
  Layer.provide(
    Resource.layer({
      serviceName: "money-transfer-effect"
    })
  )
)
