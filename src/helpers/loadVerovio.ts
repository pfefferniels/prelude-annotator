import verovio from "verovio";

export default async function newVerovio(): Promise<verovio.toolkit> {
  try {
    return new verovio.toolkit();
  } catch (e) {
    return new Promise((resolve) => {
      verovio.module.onRuntimeInitialized = () => {
        resolve(new verovio.toolkit());
      };
    });
  }
}
