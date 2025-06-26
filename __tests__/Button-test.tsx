import { render } from '@testing-library/react-native';

import { getTheme } from "../src/utils/getTheme"
import { Button } from '../src/components/Button'
import { THEMETYPE } from '../src/constants';

describe('<App />', () => {
  test('Text renders correctly on HomeScreen', () => {
    const theme = getTheme(THEMETYPE.dark);
    const { getByText } = render(<Button theme={theme} onPress={() => {}} title="Bible by heart" />);

    getByText("Bible by heart");
  });
});