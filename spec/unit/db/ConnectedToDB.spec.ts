import ConnectedToDB from '../../../src/db/ConnectedToDB'
import Balloon from '../../../test-app/app/models/Balloon'
import Composition from '../../../test-app/app/models/Composition'

describe('ConnectedToDB', () => {
  describe('#dbConnectionType', () => {
    context('on a non-ReplicaSafe model', () => {
      it('is "primary"', () => {
        const obj = new ConnectedToDB(Composition.new())
        expect(obj.dbConnectionType('select')).toEqual('primary')
      })

      context('that joins a ReplicaSafe model', () => {
        it('is "primary"', () => {
          const obj = new ConnectedToDB(Composition.new(), { innerJoinDreamClasses: [Balloon] })
          expect(obj.dbConnectionType('select')).toEqual('primary')
        })
      })
    })

    context('on a ReplicaSafe model', () => {
      it('is "replica"', () => {
        const obj = new ConnectedToDB(Balloon.new())
        expect(obj.dbConnectionType('select')).toEqual('replica')
      })

      context('for update', () => {
        it('is "primary"', () => {
          const obj = new ConnectedToDB(Balloon.new())
          expect(obj.dbConnectionType('update')).toEqual('primary')
        })
      })

      context('for insert', () => {
        it('is "primary"', () => {
          const obj = new ConnectedToDB(Balloon.new())
          expect(obj.dbConnectionType('insert')).toEqual('primary')
        })
      })

      context('for delete', () => {
        it('is "primary"', () => {
          const obj = new ConnectedToDB(Balloon.new())
          expect(obj.dbConnectionType('delete')).toEqual('primary')
        })
      })

      context('that joins a non-ReplicaSafe model', () => {
        it('is "primary"', () => {
          const obj = new ConnectedToDB(Balloon.new(), { innerJoinDreamClasses: [Composition] })
          expect(obj.dbConnectionType('select')).toEqual('primary')
        })
      })
    })
  })
})
