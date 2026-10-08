const META_PARAMETER_CONTEXT_PATH = '/api/meta/parameter-context'

export function buildMetaParameterContextRequestUrl(
  fbclid: string | undefined
) {
  if (!fbclid) return META_PARAMETER_CONTEXT_PATH

  const query = new URLSearchParams({ fbclid })

  return `${META_PARAMETER_CONTEXT_PATH}?${query.toString()}`
}
