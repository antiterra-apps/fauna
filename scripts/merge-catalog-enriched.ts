import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

type EnrichedEntry = {
  title: string
  description: string
  tags: string[]
}

type EnrichedMap = Record<string, EnrichedEntry>

function loadEnriched(enrichedPath: string): EnrichedMap {
  const text = fs.readFileSync(enrichedPath, 'utf8')
  const parsed = JSON.parse(text) as EnrichedMap
  return parsed
}

function mergeCatalog() {
  const root = process.cwd()
  const catalogPath = path.join(root, 'src', 'lib', 'catalog.ts')
  const enrichedPath = path.join(root, 'scripts', 'catalog-enriched.json')
  const outPath = path.join(root, 'src', 'lib', 'catalog.merged.ts')

  const sourceText = fs.readFileSync(catalogPath, 'utf8')
  const enriched = loadEnriched(enrichedPath)

  const sourceFile = ts.createSourceFile(
    'catalog.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'engineersManualAssets' &&
        node.initializer &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        const arrayLiteral = node.initializer

        const newElements = arrayLiteral.elements.map((el) => {
          if (!ts.isObjectLiteralExpression(el)) return el

          const idProp = el.properties.find(
            (p) =>
              ts.isPropertyAssignment(p) &&
              ts.isIdentifier(p.name) &&
              p.name.text === 'id' &&
              ts.isStringLiteral(p.initializer),
          ) as ts.PropertyAssignment | undefined

          if (!idProp || !ts.isStringLiteral(idProp.initializer)) {
            return el
          }

          const assetId = idProp.initializer.text
          const enrichedEntry = enriched[assetId]
          if (!enrichedEntry) {
            return el
          }

          const newProps = el.properties.map((prop) => {
            if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
              return prop
            }
            const key = prop.name.text

            if (key === 'title') {
              return ts.factory.updatePropertyAssignment(
                prop,
                prop.name,
                ts.factory.createStringLiteral(enrichedEntry.title),
              )
            }

            if (key === 'description') {
              return ts.factory.updatePropertyAssignment(
                prop,
                prop.name,
                ts.factory.createStringLiteral(enrichedEntry.description),
              )
            }

            if (key === 'tags') {
              const tagLiterals = enrichedEntry.tags.map((t) =>
                ts.factory.createStringLiteral(t),
              )
              return ts.factory.updatePropertyAssignment(
                prop,
                prop.name,
                ts.factory.createArrayLiteralExpression(tagLiterals, true),
              )
            }

            return prop
          })

          return ts.factory.updateObjectLiteralExpression(el, newProps)
        })

        const newArray = ts.factory.updateArrayLiteralExpression(
          arrayLiteral,
          newElements,
        )

        return ts.factory.updateVariableDeclaration(
          node,
          node.name,
          node.exclamationToken,
          node.type,
          newArray,
        )
      }

      return ts.visitEachChild(node, visit, context)
    }

    return (node) => ts.visitNode(node, visit) as ts.SourceFile
  }

  const result = ts.transform(sourceFile, [transformer])
  const transformed = result.transformed[0] as ts.SourceFile
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const newSource = printer.printFile(transformed)

  fs.writeFileSync(outPath, newSource, 'utf8')
  console.log(`Wrote merged catalog to ${outPath}`)
}

mergeCatalog()

