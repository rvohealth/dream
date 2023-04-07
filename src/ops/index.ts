import InStatement from './in'

const ops = {
  in: (arr: any[]) => {
    return new InStatement(arr)
  },
}

export default ops
