import { defineView, ViewFilterOperand } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: 'e4a11a8d-ce3b-4f2a-a5e4-458c3a4a8f9f',
  name: 'ready-ai-tasks',
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  type: 'TABLE',
  icon: 'IconPlayerPlay',
  position: 1,
  fields: [
    {
      universalIdentifier: '7e943484-d743-4ef8-9dc7-21485184a9ab',
      fieldMetadataUniversalIdentifier: '5e74303b-ebd2-4d8b-ab81-f66d84f65e73',
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '0ad34e58-d8e9-4d4a-98d6-068c47c41ca3',
      fieldMetadataUniversalIdentifier: '3cc26611-c9cc-47ec-9a9b-6b0301ef0814',
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '0f86c1d8-d06e-48f9-a748-9809ed714bdf',
      fieldMetadataUniversalIdentifier: 'b2cb81d7-4c77-41da-bab8-e7342d8063e2',
      position: 2,
      isVisible: true,
      size: 200,
    },
  ],
  filters: [
    {
      universalIdentifier: 'fb0c180d-975f-4ce7-a170-a2692345c9d2',
      fieldMetadataUniversalIdentifier: '28f8a0f4-0c44-4750-8261-280ba2a3993f',
      operand: ViewFilterOperand.IS,
      value: ['READY'],
    },
  ],
});
