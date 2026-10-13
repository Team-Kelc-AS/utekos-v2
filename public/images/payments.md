# Klarna payments SDK reference

This is the library reference for the Klarna payments JavaScript SDK. Here you can find a description of the different methods, their required parameters, and their returns.

This method initializes the Klarna payments library. It is mandatory and expects the `client_token` received when \[ initiating a payment].

For more information about initializing the JavaScript SDK, see the [check out](https://docs.klarna.com/payments/web-payments/integrate-with-klarna-payments/step-2-checkout/) section.

### Example

Here's an example of the `init()` call:

```javascript
try {
  Klarna.Payments.init({
    client_token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIifQ.dtxWM6MIcgoeMgH87tGvsNDY6cHWL6MGW4LeYvnm1JA",
  });
} catch (e) {
  // Handle error.
}
```

Initializing the Klarna Payments JS library using the `init()` method.

### Parameters

The init() method uses the following parameter:

**`options`** (Object)

| Property name                   | Description                                              |
| ------------------------------- | -------------------------------------------------------- |
| `options.client_token` (String) | The client token received when \[ initiating a payment]. |

### Returns

`InvalidClientTokenError:` If `options.client_token` is not a valid [JSON Web Token](https://jwt.io/).

## load()\~callback

This callback occurs with the result of the `load()` call.

For more examples of the potential responses, see the [Displaying the widget article](https://docs.klarna.com/payments/web-payments/integrate-with-klarna-payments/step-2-checkout/#display-klarna).

### Example

Here's an example of the `load()` callback:

| Outcome             | Response               |
| ------------------- | ---------------------- |
| Successful response | `{ show_form: true }`  |
| Error response      | `{ show_form: false }` |

### Parameters

The parameters for this method are the following:

**`res (Object)`** Response

| Property name             | Description                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `res.show_form` (Boolean) | If `true`, you should display the widget, if `false` you can decide to hide it from the user. |
| `res.error` (Object)      | If there are any adjustable errors, these are displayed here.                                 |

## load()

Display the Klarna widget in your checkout using the `load()` call.

For more information, see the [Displaying the widget article](https://docs.klarna.com/payments/web-payments/integrate-with-klarna-payments/step-2-checkout/#display-klarna).

### Example

Here are the example of the `load()` call:

**One payment method category**

```javascript
try {
  Klarna.Payments.init({ client_token: "..." });
  Klarna.Payments.load(
    {
      container: "#klarna-payments-container",
      payment_method_category: "pay_later",
    },
    {
      // Data to be updated
      billing_address: {
        // ...
      },
    },
    function (res) {
      // load~callback
      // ...
    },
  );
} catch (e) {
  // Handle error. The load~callback will have been called
  // with "{ show_form: false }" at this point.
}
```

**Multiple payment method categories**

```javascript
try {
  Klarna.Payments.init({ client_token: "..." });
  Klarna.Payments.load(
    {
      container: "#klarna-payments-container",
      payment_method_categories: ["pay_now", "pay_later"],
      instance_id: "klarna-widget",
    },
    {
      // Data to be updated
      billing_address: {
        // ...
      },
    },
    function (res) {
      // load~callback
      // ...
    },
  );
} catch (e) {
  // Handle error. The load~callback will have been called
  // with "{ show_form: false }" at this point.
}
```

### Parameters

The parameters for this method are the following:

**`options`** (Object)

| Property name                               | Description                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.container` (HTMLElement or String) | The container to render the application. It should be an HTML element or a valid CSS selector.                                                                                                                                                                                                 |
| `options.preferred_payment_method` (String) | The payment method to be pre-selected, if possible.                                                                                                                                                                                                                                            |
| `options.payment_method_category` (String)  | The category of payment methods to be loaded. This value is used later to refer to the widget when calling `authorize()`. Using `payment_method_category` lets you load one payment method per widget. To load multiple payment methods, use the `payment_method_categories` property instead. |
| `options.payment_method_categories` (Array) | The categories of payment methods to be loaded. Use this property instead of payment_method_category to load multiple payment methods. When using the `payment_method_categories` array, include an additional string, `instance_id`, for each `container` element.                            |

**`data`** (Object) An optional object with data to update on the session.

**`callback`** (load\~callback) A function that will be called when the pre-assessment is completed.

**\[DEFAULT PAYMENT METHODS IN LOAD()]**

If you don't specify any payment methods categories in the load() call, the payment methods loaded in the widget will correspond to those returned in the response to the \[initiate a payment session request]\(https\://docs.klarna.com/payments/web-payments/additional-resources/klarna-payments-sdk-reference/).

### Returns

- `ApplicationNotInitializedError`: If `load()` is called without options and/or prior to `init().`
- `InvalidContainerSelectorError`: If `options.container` is neither an HTML element nor a valid CSS selector.
- `PaymentMethodCategoryNotProvidedError`: If `options.payment_method_category` is not provided as a parameter in the `load()` call.
- `PreferredPaymentMethodNotSupportedError`: If `options.preferred_payment_method` is not supported.

## loadPaymentReview()

**\[APPLICABILITY]**

This method only applies to the US market and is only relevant if you have a multi-step checkout with an order review page.

If your checkout enables the customer to review the order after the payment step, you can also share in this review page the payment method your customer selected previously. For this, Klarna offers a payment review widget.

### Example

Here's an example of the `loadPaymentReview()` call:

```javascript
try {
  Klarna.Payments.init({ client_token: "..." });
  Klarna.Payments.loadPaymentReview(
    {
      container: "#klarna-payments-container",
    },
    function (res) {
      // loadPaymentReview~callback
      // ...
    },
  );
} catch (e) {
  // Handle error. The loadPaymentReview~callback will have been called
  // with "{ show_form: false }" at this point.
}
```

Using the `loadPaymentReview()` method.

### Parameters

The parameter for this method is the following:

**`options`** (Object)

| Property name                               | Description                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `options.container` (HTMLElement or String) | The container to render the application. Should be an HTML element or valid CSS selector. |

### Returns:

- `ApplicationNotInitializedError`: If called without `options` and/or prior to `init()`.
- `OperationNotSupportedError`: If the operation is not supported for the current purchase country.
- `InvalidContainerSelectorError`: If `options.container` is neither an HTML element nor a valid CSS selector.

## loadPaymentReview()\~callback

This call occurs with the result of the `loadPaymentReview` operation.

### Parameters

The parameter for this method is the following:

**`res`** (Object) Response

| Property name             | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `res.show_form` (Boolean) | A boolean indicating the result of the pre-assessment. |

## authorize()\~callback

This callback occurs with the result of the `authorize()` call.

For more information, see the [Get authorization section](https://docs.klarna.com/acquirer/klarna/web-payments/integrate-with-klarna-payments/other-actions/authorization-callback/).

### Examples

The following are examples of this method:

**`res`** (Object) Response

|                                               |                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Successful authorization                      | `{ authorization_token: "b4bd3423-24e3", approved: true, javascript show_form: true }`      |
| Authorization that requires finalization      | `{ approved: true, show_form: true, finalize_required: true }`                              |
| Rejected authorization with fixable errors    | `{ approved: false, show_form: true, error: {invalid_fields: ["billing_address.email"] } }` |
| Rejected authorization with no-fixable errors | `{ approved: false, show_form: false}`                                                      |

### Parameters

The parameters for this method are the following:

**`res`** (Object) Response

| Property name                      | Description                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `res.authorization_token` (String) | If the purchase is approved, this token is needed to place an order or to create a customer token.     |
| `res.show_form` (Boolean)          | A boolean indicating whether to keep showing the form or to remove it.                                 |
| `res.approved `(Boolean)           | A boolean indicating the result of the credit assessment.                                              |
| `res.finalize_required `(Boolean)  | A boolean indicating that the finalize method should be called in order to complete the authorization. |
| `res.error` (Object)               | Object specifying an error. Only available in case of fixable errors.                                  |

## authorize()

This call triggers the credit risk and fraud assessment in Klarna’s system to decide whether or not to accept the purchase.

For more information, see the [Get authorization section](https://docs.klarna.com/payments/web-payments/integrate-with-klarna-payments/step-2-checkout/#get-authorization).

**\[ORDER CREATION WINDOW]**

After a successful authorization, an order can be created within 60 minutes.

### Examples

Here are the examples of the `authorize()` call:

**One payment method category**

```javascript
try {
  Klarna.Payments.authorize(
    {
      payment_method_category: "pay_later",
    },
    {
      // Data to be updated
      billing_address: {
        // ...
      },
    },
    function (res) {
      // authorize~callback
      // ...
    },
  );
} catch (e) {
  // Handle error. The authorize~callback will have been called
  // with "{ show_form: false, approved: false }" at this point.
}
```

**Multiple payment method categories**

```javascript
try {
  Klarna.Payments.authorize(
    {
      container: "#klarna-payments-container",
      payment_method_categories: ["pay_now", "pay_later"],
      instance_id: "klarna-widget",
    },
    {
      // Data to be updated
      billing_address: {
        // ...
      },
    },
    function (res) {
      // authorize~callback
      // ...
    },
  );
} catch (e) {
  // Handle error. The authorize~callback will have been called
  // with "{ show_form: false, approved: false }" at this point.
}
```

### Parameters

The parameters for this method are the following:

**`options `** (Object)

| Property name                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.auto_finalize` (Boolean)           | An optional flag to turn off auto-finalization for the direct bank transfer payment method.                                                                                                                                                                                                                                                                                                                                                                                         |
| `options.payment_method_category` (String)  | The payment method category that was provided in the previous `load()`[load()](https://docs.klarna.com/payments/web-payments/additional-resources/klarna-payments-sdk-reference/#load) call. If you don't provide this property in the `authorize()` call, but provided it in the corresponding `load()` call, the authorization will fail.                                                                                                                                         |
| `options.payment_method_categories` (Array) | The array of payment method categories that was provided in the previous `load()`[load()](https://docs.klarna.com/payments/web-payments/additional-resources/klarna-payments-sdk-reference/#load) call. When using the `payment_method_categories` array, include an additional string, `instance_id`, for each `container` element. If you don't provide this property in the `authorize()` call, but provided it in the corresponding `load()` call, the authorization will fail. |

**data** (Object) - An optional object with data to update on the session.

**callback** (authorize\~callback) - A function to be called when the authorization is completed.

### Returns

- `PaymentMethodCategoryNotSupportedError`: If `options.payment_method_category` is not supported.
- `ApplicationNotLoadedError`: If called prior to `load()`.

## reauthorize()\~callback

This callback occurs with the result of a reauthorization.

### Examples

The following are examples of this method:

|                                                   |                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| Successful reauthorization                        | `{ authorization_token: "b4bd3423-24e3", approved: true }`                  |
| Rejected reauthorization                          | `{ approved: false }`                                                       |
| Rejected reauthorization due to an invalid update | `{ approved: false, error: { invalid_fields: ["billing_address.email"] } }` |

**\[DEPRECATED RESPONSE FIELD]**

Reauthorize currently also includes \`\{ show_form: true/false }\` in the response. This is deprecated. Instead, only an \`\{ approved: true, authorization_token: string }\` response is correct for any action for reauthorizing.

### Parameters

The parameters for this method are the following:

**`res`** (Object) Response

| Property name                      | Description                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `res.show_form` (Boolean)          | A boolean indicating whether to keep showing the form or to remove it.                    |
| `res.authorization_token` (String) | If credit is approved, this token is needed to place an order or create a customer token. |
| `res.approved` (Boolean)           | A boolean indicating the result of the credit assessment.                                 |
| `res.error` (Object)               | Only available in case of fixable errors.                                                 |

## reauthorize()

You need to get a reauthorization if your customer made a change in the order. This applies to multi-step checkouts, where you offer a review page after selecting the payment method.

The `authorization_token` you received originally is only valid for that specific state of the order. If you attempt to place an order without doing a reauthorize, it will fail.

**\[RECOMMENDED FOR INTEGRATION]**

If the payment method widget is still visible, use a regular \`authorize()\` call instead.

We suggest you trigger reauthorize once the customer clicks to complete the order. As with `authorize()`, you can provide an optional update object including all order details. It is also possible to start with a server-side session update per REST API, followed by an empty client-side call to reauthorize. The reauthorize call may trigger your customer confirmation on changed financing details. The integration should wait for the callback function.

If it happens on a different page than where you originally ran `init()`, you need to initialize the SDK before doing reauthorize.

### Examples

Here's an example of the `reauthorize()` call:

```javascript
try {
  Klarna.Payments.init({ client_token: "..." });
  Klarna.Payments.reauthorize(
    {
      payment_method_category: "pay_later",
    },
    {
      // Data to be updated
      billing_address: {
        // ...
      },
    },
    function (res) {
      // reauthorize~callback
      // ...
    },
  );
} catch (e) {
  // Handle error. The reauthorize~callback will have been called
  // with "{ show_form: false, approved: false  }" at this point.
}
```

Using the reauthorize() call.

### Parameters

The parameters for this method are the following:

**`options`** (Object)

| Property name                              | Description                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `options.payment_method_category` (String) | The category of payment methods to be loaded. Only one can be included. |

**data** (Object) - An optional object with data to update on the session.

**callback** (authorize\~callback) - A function that will be called when the reauthorization is completed.

### Returns

- `ApplicationNotInitializedError`: If called prior to `init()`.
- `PaymentMethodCategoryNotSupportedError`: If `options.payment_method_category` is not supported.
- `PaymentMethodCategoryNotProvidedError`: If `options.payment_method_category` is not provided when required.

## finalize()\~callback

This callback occurs with the result of the `finalize()` operation.

For more information, see the [Finalize an authorization section](https://docs.klarna.com/acquirer/klarna/web-payments/integrate-with-klarna-payments/other-actions/finalize-an-authorization/).

**\[APPLICABILITY]**

This is only relevant if you have a multi-step checkout and are offering direct debit through Klarna’s widget.

### Examples

The following are examples of this method:

| Outcome                                        | Response                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Successful finalization                        | `{ authorization_token: "b4bd3423-24e3", approved: true, show_form: true }`                  |
| Rejected or aborted finalization               | `{ approved: false, show_form: false }`                                                      |
| Rejected finalization due to an invalid update | `{ approved: false, show_form: true, error: { invalid_fields: ["billing_address.email"] } }` |

### Parameters

The parameters for this method are the following:

**`res`** (Object) Response

| Property name                      | Description                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `res.show_form `(Boolean)          | A boolean indicating whether to keep showing the form or to remove it.                          |
| `res.authorization_token `(String) | If the purchase is approved, this token is needed to place an order or create a customer token. |
| `res.approved` (Boolean)           | A boolean indicating the result of the credit assessment.                                       |
| `res.error `(Object)               | Only available in case of fixable errors.                                                       |

## finalize()

Finalizing the authorization is required for some payment methods.

For more information, see the [Finalize an authorization section](https://docs.klarna.com/acquirer/klarna/web-payments/integrate-with-klarna-payments/other-actions/finalize-an-authorization/).

**\[MULTI-STEP CHECKOUT ONLY]**

This section is only relevant if you have a multi-step checkout and offer direct debit in the Klarna widget.

### Example

Here's an example of the `finalize()` call:

```javascript
try {
  Klarna.Payments.init({ client_token: "..." });
  Klarna.Payments.finalize(
    {
      payment_method_category: "pay_later",
    },
    {
      // Data to be updated
      billing_address: {
        // ...
      },
    },
    function (res) {
      // finalize~callback
      // ...
    },
  );
} catch (e) {
  // Handle error. The finalize~callback will have been called
  // with "{ show_form: false, approved: false }" at this point.
}
```

Using the `finalize()` call.

### Parameters

The parameter for this method are the following:

**`options`** (Object)

| Property name                              | Description                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `options.payment_method_category` (String) | The payment method category that was provided in the previous load() call. |

**data** (Object) An optional object with data to update on the session.

**callback** (finalize\~callback) A function that will be called when the finalization is completed.

### Returns

- `ApplicationNotInitializedError`: If called prior to `init().`
- `ApplicationNotLoadedError`: If called prior to `load().`
- `PaymentMethodCategoryNotProvidedError`: If `options.payment_method_category` is not provided when required.
- `PaymentMethodCategoryNotSupportedError`: If `options.payment_method_category` is not supported.

## on()\~eventHandler

This `eventHandler` occurs whenever the associated event is emitted inside Klarna payments.

### Parameters

The parameter for this method is the following:

**`payload `** - The payload may vary between events.

## on()

This method registers an event handler for the given `eventName`. The events are triggered internally in Klarna payments. The supported events are:

| Event                     | Comment                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `heightChanged`           | Emitted when the height of the iframe changes. The registered event handler is called with the new height (in pixels) as a number (integer). |
| `fullscreenOverlayShown`  | Emitted when the fullscreen overlay is shown.                                                                                                |
| `fullscreenOverlayHidden` | Emitted when the fullscreen overlay is hidden.                                                                                               |

### Example

Here's an example of the `on()` call:

```javascript
Klarna.Payments.on("heightChanged", function (newHeight) {
  console.log("got new iframe height", newHeight);
});
```

Sample event listener definition for `heightChanged.`

### Parameters

The parameters for this method are the following:

| Name                              | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `eventName` (String)              | The name of the event to which you want to subscribe.         |
| `eventHandler` (on\~eventHandler) | The function that should be called when the event is emitted. |

### Returns

\*\*`EventNotSupportedError: ` \*\*If trying to register an unsupported event.

## off()

This method unregisters an event handler for the given `eventName`.

### Example

```javascript
var theEventHandler = function () { ... }
Klarna.Payments.on('heightChanged', theEventHandler)

// unregister this specific listener for heightChanged
Klarna.Payments.off('heightChanged', theEventHandler)

// unregister _all_ listeners for heightChanged
Klarna.Payments.off('heightChanged')

```

De-registering event listeners.

### Parameters

The parameters for this method are the following:

| Name                              | Description                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `eventName` (String)              | The name of the event to which you want to subscribe.                                                                             |
| `eventHandler` (on\~eventHandler) | The function that was previously registered for the `eventName`. Omit if you want to unregister all handlers for the `eventName`. |
