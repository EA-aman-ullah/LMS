import mongoose from "mongoose";

const idStateSchema = new mongoose.Schema({
  _id: { type: String, default: "idState" },
  year: { type: Number, required: true },
  prefix: { type: String, required: true },
  counter: { type: Number, required: true },
});

const IdState = mongoose.model("IdState", idStateSchema);

async function createIdGenerator() {
  let state = await IdState.findById("idState");
  if (!state) {
    state = new IdState({
      _id: "idState",
      year: new Date().getFullYear(),
      prefix: "AA",
      counter: 1,
    });
    await state.save();
  }

  function incrementPrefix(prefix) {
    const chars = prefix.split("");
    let carry = true;
    for (let i = chars.length - 1; i >= 0; i--) {
      if (carry) {
        if (chars[i] === "Z") {
          chars[i] = "A";
        } else {
          chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
          carry = false;
        }
      }
    }
    return carry ? "AA" : chars.join("");
  }

  return async function generateId(type) {
    const id = `${state.prefix}${state.year}${type}${String(
      state.counter
    ).padStart(6, "0")}`;
    state.counter++;

    if (state.counter > 999999) {
      state.counter = 1;
      state.prefix = incrementPrefix(state.prefix);
    }

    if (state.prefix === "ZZ" && state.counter === 1) {
      state.prefix = "AA";
      state.year++;
    }

    await state.save();
    return id;
  };
}

export default await createIdGenerator();
