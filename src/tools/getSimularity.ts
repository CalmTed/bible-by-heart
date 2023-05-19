export const getSimularity: (w1: string, w2:string) => number = (w1,w2) => {
  //returns (0-1]
  if(w1 === w2){
    return 1;
  }
  const maxLength = Math.max(w1.length, w2.length)
  const w1Array = w1.split("")
  const w2Array = w2.split("")
  const letters = new Set()
  w1Array.map(l1 => {
    w2Array.map(l2 => {
      if(l1 === l2){
        letters.add(l1)
      }
    })

  })
  const totalCharsNumber = letters.size
  const mapRange = (value: number, a:number, b:number, c:number, d:number) => {
    value = (value - a) / (b - a);
    return c + value * (d - c);
  }
  const charSimularity = mapRange(totalCharsNumber, maxLength, 0, 0.5, 0)
  const lengthSimularity = mapRange(Math.abs(w1.length - w2.length), 0, maxLength, 0.5, 0)
  return charSimularity + lengthSimularity;
}