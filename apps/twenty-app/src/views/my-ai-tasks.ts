import { defineView, ViewFilterOperand } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '5210d686-3ffd-42bf-b429-83ee8e2e4240',
  name: 'my-ai-tasks',
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  type: 'TABLE',
  icon: 'IconUserCircle',
  position: 1,
  fields: [
    { universalIdentifier: 'fd8e9eda-9c98-4269-b1e5-38faa00ac18c', fieldMetadataUniversalIdentifier: '5e74303b-ebd2-4d8b-ab81-f66d84f65e73', position: 0, isVisible: true, size: 200 },
    { universalIdentifier: '96eff416-990a-4119-a7f3-b399ed514892', fieldMetadataUniversalIdentifier: '28f8a0f4-0c44-4750-8261-280ba2a3993f', position: 1, isVisible: true, size: 140 },
    { universalIdentifier: '385a3ccb-592d-4281-9c0b-a1138ff1ef08', fieldMetadataUniversalIdentifier: '3cc26611-c9cc-47ec-9a9b-6b0301ef0814', position: 2, isVisible: true, size: 140 },
    { universalIdentifier: 'b078e363-0946-4b8e-964a-c591ec5b8998', fieldMetadataUniversalIdentifier: 'b2cb81d7-4c77-41da-bab8-e7342d8063e2', position: 3, isVisible: true, size: 180 },
  ],
  filters: [
    {
      universalIdentifier: '1ab6ff46-64b9-4b3d-bee0-0776d5bba7a1',
      fieldMetadataUniversalIdentifier: '6ccba282-8d22-40c1-a6b4-cf5ccdfcd199',
      operand: ViewFilterOperand.IS,
      value: { isCurrentWorkspaceMemberSelected: true, selectedRecordIds: [] },
    },
  ],
  mainGroupByFieldMetadataUniversalIdentifier: '28f8a0f4-0c44-4750-8261-280ba2a3993f',
});
