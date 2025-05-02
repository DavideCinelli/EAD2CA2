describe('Basic Tests', () => {
  test('sum function works correctly', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(1, 2)).toBe(3);
  });

  test('string operations work correctly', () => {
    const reverseString = (str: string) => str.split('').reverse().join('');
    expect(reverseString('hello')).toBe('olleh');
  });

  test('array operations work correctly', () => {
    const array = [1, 2, 3, 4, 5];
    const filtered = array.filter(num => num % 2 === 0);
    expect(filtered).toEqual([2, 4]);
  });
}); 