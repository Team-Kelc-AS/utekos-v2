import * as z from '@/lib/validation/zodMini'

export const metaParameterBuilderProtectedValueSchema = z
  .string()
  .check(z.regex(/^[a-f0-9]{64}\.[A-Za-z0-9_-]{8}$/u))

const metaParameterBuilderProtectedValueListSchema = z
  .array(metaParameterBuilderProtectedValueSchema)
  .check(z.minLength(1), z.maxLength(2))

export const metaParameterBuilderUserDataSchema = z.strictObject(
  {
    city: z.optional(metaParameterBuilderProtectedValueListSchema),
    country: z.optional(metaParameterBuilderProtectedValueListSchema),
    email: z.optional(metaParameterBuilderProtectedValueListSchema),
    first_name: z.optional(metaParameterBuilderProtectedValueListSchema),
    last_name: z.optional(metaParameterBuilderProtectedValueListSchema),
    phone: z.optional(metaParameterBuilderProtectedValueListSchema),
    postal_code: z.optional(metaParameterBuilderProtectedValueListSchema),
    state: z.optional(metaParameterBuilderProtectedValueListSchema)
  }
)

export const metaParameterBuilderContextSchema = z.strictObject({
  user_data: metaParameterBuilderUserDataSchema
})

export type MetaParameterBuilderUserData = z.infer<
  typeof metaParameterBuilderUserDataSchema
>
