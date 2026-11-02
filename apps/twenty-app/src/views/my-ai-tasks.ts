import { defineView, ViewFilterOperand } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '5210d686-3ffd-42bf-b429-83ee8e2e4240',
  name: 'my-ai-tasks',
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  type: 'TABLE',
  icon: 'IconUserCircle',
  position: 1,
  fields: [
    { universalIdentifier: 'fd8e9eda-9c98-4269-b1e5-38faa00ac18c', fieldMetadataUniversalIdentifier: 'f7038bd4-3b13-43fd-b3dd-82a785681130', position: 0, isVisible: true, size: 200 },
    { universalIdentifier: '96eff416-990a-4119-a7f3-b399ed514892', fieldMetadataUniversalIdentifier: '9cc55d6e-85b2-4712-b54f-f176c77278e0', position: 1, isVisible: true, size: 140 },
    { universalIdentifier: '385a3ccb-592d-4281-9c0b-a1138ff1ef08', fieldMetadataUniversalIdentifier: 'a81cdb79-10fa-42e0-9d05-462cf7f47338', position: 2, isVisible: true, size: 140 },
    { universalIdentifier: 'b078e363-0946-4b8e-964a-c591ec5b8998', fieldMetadataUniversalIdentifier: '572cf480-7281-49ea-9b7f-d4758bab42c5', position: 3, isVisible: true, size: 180 },
  ],
  filters: [
    {
      universalIdentifier: '1ab6ff46-64b9-4b3d-bee0-0776d5bba7a1',
      fieldMetadataUniversalIdentifier: '5b80fd3a-3293-4d6e-a095-fb395a1c562c',
      operand: ViewFilterOperand.IS,
      value: { isCurrentWorkspaceMemberSelected: true, selectedRecordIds: [] },
    },
  ],
  mainGroupByFieldMetadataUniversalIdentifier: '9cc55d6e-85b2-4712-b54f-f176c77278e0',
});
