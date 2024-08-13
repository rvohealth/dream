import path from 'path'
import sharedPrefix from '../../../../src/helpers/path/sharedPathPrefix'

describe('sharedPrefix', () => {
  context('when the strings share nothing', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('abc', 'xyz')).toEqual('')
    })
  })

  context('when the first string is empty', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('', 'xyz')).toEqual('')
    })
  })

  context('when the second string is empty', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('abc', '')).toEqual('')
    })
  })

  context('when both strings are empty', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('', '')).toEqual('')
    })
  })

  context('when the strings share a prefix', () => {
    it('returns the shared prefix', () => {
      expect(sharedPrefix('abcdefg', 'abcdxyz')).toEqual('abcd')
    })

    context('when the first string is shorter', () => {
      it('returns the shared prefix', () => {
        expect(sharedPrefix('abcdef', 'abcdxyz')).toEqual('abcd')
      })
    })

    context('when the second string is shorter', () => {
      it('returns the shared prefix', () => {
        expect(sharedPrefix('abcdefg', 'abcdxy')).toEqual('abcd')
      })
    })
  })

  context('when the strings are identical', () => {
    it('returns the string', () => {
      expect(sharedPrefix('abc', 'abc')).toEqual('abc')
    })
  })

  context('when the strings include utf-8 specific characters', () => {
    it('returns the shared prefix', () => {
      expect(sharedPrefix('☺abcdefg', '☺abcdxyz')).toEqual('☺abcd')
    })
  })

  context('when the strings include the path delimiter', () => {
    it('returns the shared prefix, including the trailing path delimiter', () => {
      expect(sharedPrefix(`abcd${path.sep}efg`, `abcd${path.sep}xyz`)).toEqual('abcd/')
    })

    context('when the strings share initial, but not all characters after a path delimiter', () => {
      it('omit the entire string after the path delimiter', () => {
        expect(sharedPrefix(`abc${path.sep}defg`, `abc${path.sep}dxyz`)).toEqual('abc/')
      })

      it('handles multiple path delimiters', () => {
        expect(sharedPrefix(`abc${path.sep}def${path.sep}g`, `abc${path.sep}def${path.sep}gh`)).toEqual(
          'abc/def/'
        )
      })
    })
  })
})
