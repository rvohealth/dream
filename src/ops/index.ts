import InStatement from './in'
import ILikeStatement from './ilike'
import LikeStatement from './like'

const ops = {
  in: (arr: any[]) => new InStatement(arr),
  like: (like: string) => new LikeStatement(like),
  ilike: (ilike: string) => new ILikeStatement(ilike),
}

export type OpsStatement = LikeStatement | ILikeStatement | InStatement

export default ops
