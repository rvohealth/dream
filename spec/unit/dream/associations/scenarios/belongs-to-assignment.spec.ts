import Mylar from '../../../../../test-app/app/models/Balloon/Mylar.js'
import HeartRating from '../../../../../test-app/app/models/ExtraRating/HeartRating.js'
import Pet from '../../../../../test-app/app/models/Pet.js'
import Post from '../../../../../test-app/app/models/Post.js'
import Rating from '../../../../../test-app/app/models/Rating.js'
import User from '../../../../../test-app/app/models/User.js'

describe('assigning a belongs to association', () => {
  it('sets the value of the foreign key to the primary key value of the model it belongs to', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = Post.new()
    post.user = user

    expect(post.userId).toEqual(user.id)
  })

  context('with a primary key override on the association', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const pet = Pet.new()
      pet.userThroughUuid = user

      expect(pet.userUuid).toEqual(user.uuid)
    })
  })
})

context('with a polymorphic association', () => {
  it('sets the foreign key type to the class name of the associated model', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = await Post.create({ user, body: 'howyadoin' })
    const rating = Rating.new()
    rating.rateable = post

    expect(rating.rateableType).toEqual('Post')
    expect(rating.rateableId).toEqual(post.id)
  })

  context('when the model being assined is an STI child', () => {
    it('sets the foreign key type to the class name of the associated STI base model', async () => {
      const mylarBalloon = await Mylar.create()
      const heartRating = HeartRating.new()
      heartRating.extraRateable = mylarBalloon

      expect(heartRating.extraRateableType).toEqual('Balloon')
      expect(heartRating.extraRateableId).toEqual(mylarBalloon.id)
    })
  })
})
