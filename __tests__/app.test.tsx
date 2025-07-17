import App from "../App";
describe("<App />", () => {
  // test("Text renders correctly on HomeScreen", () => {
  //   // const theme = getTheme(THEMETYPE.dark);
  //   console.log(tree)
  //   expect(tree).toMatchSnapshot();
  //   // getByText("Bible by heart");
  // });
  it("should not test app in total", () => {
    expect(typeof App).not.toBe("undefined");
  });
});
