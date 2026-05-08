Frontend domain structure (aligned with backend modules):

- `modules/business`
  - `admin`
  - `order`
  - `page`
  - `product`
  - `review` (legacy pages)
  - `support` (legacy pages)

- `modules/platform`
  - `api`
  - `app`
  - `auth`
  - `calendar`
  - `common`
  - `user`

- `modules/social`
  - `chat`
  - `chatbot` (legacy pages)
  - `follow`
  - `friend`
  - `notification`
  - `post`

Legacy page files are grouped under each feature:
- `modules/**/**/legacy/pages`

Shared legacy adapters remain in:
- `src/legacy/api.js`
- `src/legacy/followApi.js`
