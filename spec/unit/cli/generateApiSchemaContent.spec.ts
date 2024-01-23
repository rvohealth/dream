import generateApiSchemaContent from '../../../src/helpers/cli/generateApiSchemaContent'

describe('dream generate:api', () => {
  it('generates enum types', async () => {
    const file = await generateApiSchemaContent()
    expect(file).toContain(`\
export type Species = 'cat' | 'dog' | 'frog'
export const SpeciesValues = [
  'cat',
  'dog',
  'frog'
]`)
  })

  context('attributes', () => {
    it('supports string attributes', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain(`\
export interface GraphEdge {
  name: string
}`)
    })

    it('supports number attributes', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('popKPop: number')
    })

    it('supports boolean attributes', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('kPop: boolean')
    })

    it('renders date attributes as string type', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('createdAt: string')
    })

    it('renders datetime attributes as string type', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('updatedAt: string')
    })

    it('renders decimal attributes as number type', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('roundedPopKPop: number')
    })

    it('handles enum attributes', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('species: Species')
    })

    it('generates any for unspecified types', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain(`\
export interface GraphNode {
  name: any
}`)
    })
  })

  context('associations', () => {
    it('ignores invalid associations', async () => {
      const file = await generateApiSchemaContent()
      expect(file).not.toContain('gobbledeegook')
    })

    context('RendersOne', () => {
      context('with implicit serializer', () => {
        it('looks up serializer through associated model and renders correct type', async () => {
          const file = await generateApiSchemaContent()
          expect(file).toContain(`\
export interface Collar {
  lost: any
  pet: Pet
}`)
        })
      })

      context('with explicit serializer', () => {
        it('uses provided serializer from callback', async () => {
          const file = await generateApiSchemaContent()
          expect(file).toContain(`\
export interface BalloonSpotterBalloon {
  balloonSpotter: any
  balloon: BalloonSummary
}`)
        })
      })
    })

    context('RendersMany', () => {
      context('with implicit serializer', () => {
        it('looks up serializer through associated model and renders correct type', async () => {
          const file = await generateApiSchemaContent()
          expect(file).toContain(`\
export interface BalloonSpotter {
  name: any
  balloons: BalloonSummary[]
}`)
        })
      })

      context('with explicit serializer', () => {
        it('uses provided serializer from callback', async () => {
          const file = await generateApiSchemaContent()

          expect(file).toContain(`\
export interface Pet {
  id: string
  name: string
  species: Species
  ratings: Rating[]
}`)
        })
      })
    })
  })
})
