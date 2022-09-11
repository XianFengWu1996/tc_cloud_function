import { Request, Response } from "express";
import { format_date } from "../utils/time";
import {
  handlePlaceInstoreOrder,
  handlePlaceOnlineOrder,
} from "../utils/payment";
import { validateCart } from "../utils/validateData";

// place an online order but not process the payment yet
export const placeOnlineOrder = async (req: Request, res: Response) => {
  try {
    // validate all the data
    validateCart(req.body.cart);
    // place the order to firestore
    await handlePlaceOnlineOrder({
      user: req.user,
      cart: req.body.cart as ICart,
      payment_intent_id: "",
    });

    res.status(200).send();
  } catch (error) {
    res
      .status(400)
      .send({ error: (error as Error).message ?? "Failed to submit order" });
  }
};

// place the order since it does not require payment
export const placeInstoreOrder = async (req: Request, res: Response) => {
  try {
    const cart = req.body.cart as ICart;
    const { formatted } = format_date();

    // validate all the data
    validateCart(cart);
    // place the order to firestore
    let { customer } = await handlePlaceInstoreOrder({
      user: req.user,
      cart: req.body.cart as ICart,
      payment_intent_id: "",
    });

    res.status(200).send({
      redirect_url: `/order/confirmation?order_id=${
        cart.order_id
      }&order_time=${formatted}&name=${
        customer.name
      }&estimate=${15}&item_count=${cart.cart_quantity}&total=${cart.total}`,
    });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .send({ error: (error as Error).message ?? "Failed to submit order" });
  }
};
