import { defineView, ViewFilterOperand } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '2cb26502-e03a-4501-8bff-c5128d707ee4',
  name: 'ready-ai-tasks',
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  type: 'TABLE',
  icon: 'IconPlayerPlay',
  position: 2,
  fields: [
    { universalIdentifier: '0d2e38cd-d510-4794-9f6e-6126ba5391c7', fieldMetadataUniversalIdentifier: 'f7038bd4-3b13-43fd-b3dd-82a785681130', position: 0, isVisible: true, size: 200 },
    { universalIdentifier: '3114041e-8ec4-4f55-8c0d-25ef82495598', fieldMetadataUniversalIdentifier: '9cc55d6e-85b2-4712-b54f-f176c77278e0', position: 1, isVisible: true, size: 140 },
    { universalIdentifier: 'fbeb6e9a-b96c-4631-b429-23d0a84afa72', fieldMetadataUniversalIdentifier: 'a81cdb79-10fa-42e0-9d05-462cf7f47338', position: 2, isVisible: true, size: 140 },
    { universalIdentifier: '1848c07c-d320-4ade-b630-7c3acbed2792', fieldMetadataUniversalIdentifier: '572cf480-7281-49ea-9b7f-d4758bab42c5', position: 3, isVisible: true, size: 180 },
  ],
  filters: [
    {
      universalIdentifier: 'e78af774-fbf9-46a6-9298-327a7d9181e3',
      fieldMetadataUniversalIdentifier: '9cc55d6e-85b2-4712-b54f-f176c77278e0',
      operand: ViewFilterOperand.IS,
      value: ['READY'],
    },
  ],
});
