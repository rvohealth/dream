export default class SchemaBuilder {
    build(): Promise<void>;
    private globalModelNames;
    private buildSchemaContent;
    private getSchemaImports;
    private tableData;
    private getColumnData;
    private enumType;
    private getVirtualColumns;
    private getSchemaData;
    private getAssociationData;
    private getExportedModulesFromDbSync;
    private getTables;
    private kyselyType;
    private coercedType;
    private loadDbSyncFile;
}
