export class CartError extends Error {
  constructor(
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}

