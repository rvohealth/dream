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

    it('supports json attributes', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('metadata: any')
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

    it('handles type attributes', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain('type: BalloonTypesEnum')
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
    it('renders valid associations even when serializers are not exported default', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain(`\
export interface Post {
  postVisibility: PostVisibility
}`)
    })

    it('infers serializers from related models when spelling of serializer is identical to the model name', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain(`\
export interface Composition {
  id: any
  metadata: any
  compositionAssets: any[]
  localizedTexts: LocalizedTextBase[]
  currentLocalizedText: LocalizedTextBase
}`)
    })

    it('allows passing of serializer path and export to override default path/export expectations', async () => {
      const file = await generateApiSchemaContent()
      expect(file).toContain(`\
export interface CompositionAlternate {
  id: any
  metadata: any
  compositionAssets: any[]
  localizedTexts: LocalizedTextBase[]
  currentLocalizedText: LocalizedTextBase
}`)
    })

    context('given a serializer which is not exported as default, nor as the name of the file', () => {
      it('still catalogues serializer, but does not include non-serializers exported from the same file', async () => {
        const file = await generateApiSchemaContent()
        expect(file).toContain('export interface LocalizedTextBase')
        expect(file).not.toContain('thisFunctionShouldNotBePartOfClientApiExport')
      })
    })

    context('RendersOne', () => {
      context('with implicit serializer', () => {
        it('looks up serializer through associated model and renders correct type', async () => {
          const file = await generateApiSchemaContent()
          expect(file).toContain(`\
export interface Collar {
  id: any
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
  gobbledeegook: any
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
