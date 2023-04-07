const ops = {
  in: (arr: any[]) => {
    return new InStatement(arr)
  },
}

export class InStatement {
  public in: any[]
  constructor(arr: any[]) {
    this.in = arr
  }
}

export default ops
