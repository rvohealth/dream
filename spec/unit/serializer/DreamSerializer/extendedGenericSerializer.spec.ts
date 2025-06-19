import { DreamSerializer } from '../../../../src/index.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import BalloonLine from '../../../../test-app/app/models/BalloonLine.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'

describe('extending a generic DreamSerializer', () => {
  it('enables chaining a descendant model serializer off of a base model', () => {
    const AncestorSerializer = <T extends Balloon>(StiChildClass: typeof Balloon, data: T) =>
      DreamSerializer(StiChildClass, data)
        .attribute('color')
        .rendersOne<Balloon, 'balloonLine'>('balloonLine', { serializerKey: 'summary' })
        .rendersMany<Balloon, 'heartRatings'>('heartRatings', { serializerKey: 'default' })

    const MySerializer = (data: Mylar) => AncestorSerializer(Mylar, data).attribute('mylarOnlyProperty')

    const balloonLine = BalloonLine.new({ material: 'nylon' })
    const heartRating = HeartRating.new({ id: 333, rating: 7 })
    const balloon = Mylar.new({ color: 'blue', mylarOnlyProperty: 'Howdy' })
    balloon.balloonLine = balloonLine
    balloon.heartRatings = [heartRating]

    const serializer = MySerializer(balloon)

    expect(serializer.render()).toEqual({
      color: 'blue',
      mylarOnlyProperty: 'Howdy',
      balloonLine: {
        material: 'nylon',
      },
      heartRatings: [
        {
          id: 333,
          type: 'HeartRating',
        },
      ],
    })
  })
})
