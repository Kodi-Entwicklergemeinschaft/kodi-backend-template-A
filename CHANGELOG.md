# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.24.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.22.0...v1.24.0) (2025-12-04)


### 🔧 Chores

* **release:** 1.23.0 ([f73d714](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f73d714ff3a3ba7865af63b3e679a8265e0c1bbe))


### ✨ Features

* **config:** add API_DOMAIN configuration for dynamic and static environments ([086f196](https://github.com/The-Kodi-Suite/kodi.microservices/commit/086f196d456245bda519e3cb81d538c9f856515e))
* **config:** add support for legacy API domain during transition ([d502457](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d5024571ac4f1b753be4fe53b46dd58c408da180))
* **notifications:** enhance logging and language handling in FCMTranslationService ([2ee64fd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2ee64fd0edd3d303ded50aedf7807605d0e411a7))
* **users:** add language preference update endpoint and DTOs ([97bcf50](https://github.com/The-Kodi-Suite/kodi.microservices/commit/97bcf507f44d530154c5ea6ad5db80355b2a3525))
* **users:** add success message for profile update endpoint ([1bee0a1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1bee0a149bf671120d57f175a7730fd5940cb23a))
* **users:** add success message for user update endpoint ([d13ba62](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d13ba62892c22967a2aa1d7946ed9ae3bbe54b42))
* **users:** implement user management controllers for admin and public access ([8719854](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8719854f3b1a3f0f398d3a7bb3029d77e7ee9ab1))


### ♻️ Code Refactoring

* **categories:** filter only active subcategories in category service ([95da372](https://github.com/The-Kodi-Suite/kodi.microservices/commit/95da372920fad2a6c2b8cf77df3f0f603285f425))
* **i18n:** consolidate success message translations for user preferences ([2215a75](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2215a758f0fd3231eed4b7721a9de5a6f56ae027))
* **i18n:** enhance language handling in TransformInterceptor ([d63e616](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d63e6167aadf19a1a2e8218db7b5f0a66de793ab))
* **i18n:** improve translation loading and error handling ([62611e6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/62611e6b4515bcb3f107506c681c1e6ef21259a8))
* **users:** improve device management logic for user ownership transfer ([b0d456d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b0d456d28208e72958b50ef15ee24dd3b94d18fa))
* **users:** remove deprecated language and notification preference DTOs ([98d0210](https://github.com/The-Kodi-Suite/kodi.microservices/commit/98d02105315bb933525852dd67b1c17254960b04))
* **users:** remove UsersController and restructure user management ([dda40bb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/dda40bb4dab7b93360ef06c50d9f66256f3fa22c))
* **users:** unify user preferences management and streamline endpoints ([eada964](https://github.com/The-Kodi-Suite/kodi.microservices/commit/eada964b6153c35f5918ab49a6f223a4025f37c4))

## [1.23.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.22.0...v1.23.0) (2025-12-04)


### ✨ Features

* **users:** add success message for profile update endpoint ([1bee0a1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1bee0a149bf671120d57f175a7730fd5940cb23a))
* **users:** add success message for user update endpoint ([d13ba62](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d13ba62892c22967a2aa1d7946ed9ae3bbe54b42))


### ♻️ Code Refactoring

* **categories:** filter only active subcategories in category service ([95da372](https://github.com/The-Kodi-Suite/kodi.microservices/commit/95da372920fad2a6c2b8cf77df3f0f603285f425))
* **i18n:** enhance language handling in TransformInterceptor ([d63e616](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d63e6167aadf19a1a2e8218db7b5f0a66de793ab))
* **i18n:** improve translation loading and error handling ([62611e6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/62611e6b4515bcb3f107506c681c1e6ef21259a8))
* **users:** improve device management logic for user ownership transfer ([b0d456d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b0d456d28208e72958b50ef15ee24dd3b94d18fa))

## [1.22.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.21.0...v1.22.0) (2025-12-03)


### 🔧 Chores

* **release:** update version to 1.21.0 in package-lock.json ([9a246bb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9a246bbe31d2ab0b65dfdf15cd9782a92e2090c2))


### 🐛 Bug Fixes

* **auth:** update password minimum length requirement in LoginDto ([70029e9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/70029e97689055acad93ac797fdcbc4cc7811046))
* **category-assets:** update header background colors for categories ([a2fe5bd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a2fe5bdc3cce54fafac21ddb7e0034596ded4ad5))
* **translations:** improve translation handling in category and parking space services ([80d7bf6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/80d7bf67b70e92bcf06581540b8d9bccb0ec53b4))
* **translations:** refine display names in city category seeding for clarity ([c8d65bc](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c8d65bc041f91254c0516f1a3428191e903aac83))
* **translations:** update entityId and field names in city category seeding ([d69e93b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d69e93b2b11cfb2955bbdc24ac2696f6ceb7bdd9))


### ✨ Features

* **assets:** add icon file names and SVG assets for categories ([959fb36](https://github.com/The-Kodi-Suite/kodi.microservices/commit/959fb36e4730247a179db6be8b447f5d79498ecc))
* **assets:** implement category icon handling and upload functionality ([0838d6d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0838d6d250de03dbcf9354825528de4730cd1f94))
* **auth:** add language support to login and terms acceptance ([f028fe9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f028fe9ee31b75835b9339ea8432c3e6c6f82637))
* **categories:** add endpoint to retrieve main categories and enhance category service logic ([d909773](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d909773996a82021cc6a7dd25442cbe1a880a372))
* **categories:** add rootOnly filter and success messages for main categories retrieval ([efe2764](https://github.com/The-Kodi-Suite/kodi.microservices/commit/efe27644d45ddd8f35cef7671574c8b2cab63fa6))
* **categories:** enhance category filtering to exclude inactive parent categories ([95f9fe0](https://github.com/The-Kodi-Suite/kodi.microservices/commit/95f9fe02204444d7234f63a43ac072b50feb42b8))
* **categories:** enhance city category listing with search and pagination ([3019265](https://github.com/The-Kodi-Suite/kodi.microservices/commit/301926569c0ceda8005fabf27ac6be1e1eca5e94))
* **categories:** enhance city category retrieval to include children categories ([1c89f34](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1c89f3495f28a8587ef7a568d14e88288e6f2a7c))
* **categories:** enhance role handling in category access checks ([e7c45c6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e7c45c60e9eb8ec53ca47e2d4d818911b0ca5b24))
* **categories:** include parentId in category retrieval and adjust color assignment logic ([e17a6f8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e17a6f8c350c259e6b7e545ab5826c3d1a1bdb7a))
* **categories:** rename displayName to name and add endpoint for city category retrieval ([2be47ca](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2be47ca9d168393304311b758b3558a0a408e448))
* **categories:** update city category transformation and retrieval logic ([5f0ab25](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5f0ab255526734463eb78da352ed899ddc0a0c2b))
* **categories:** update CityCategoryResponseDto to include description and modify categoryId handling ([29d9978](https://github.com/The-Kodi-Suite/kodi.microservices/commit/29d9978e62893c63d12d883deeb78dbf8ba431b8))
* **copilot:** add comprehensive instructions for AI coding agents in the KODI microservices monorepo ([4ddfb59](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4ddfb591ab61955d857d733a49e2d697872b3d16))
* **docs:** add comprehensive AI Assistant guide for KODI microservices ([7921f46](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7921f4605e928a5da61053e0e6f1b61fad7ef0ee))
* **docs:** add comprehensive scaffolding guides for RabbitMQ patterns, DTOs, modules, services, and seed scripts ([732e77f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/732e77f4b025a2516958ea50a21b518c84be392c))
* **file-upload:** enhance SVG file handling in file upload service ([dd7a901](https://github.com/The-Kodi-Suite/kodi.microservices/commit/dd7a9019acdf46cdba68a4785d5a7a166fd36892))
* **listings:** implement auto-publish and auto-approval for admin-created listings ([13cf69b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/13cf69bf029f9615bef693d0cdf4f2dd622f8bf6))
* **terms:** add language detection for terms retrieval endpoints ([6ecb420](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6ecb420619125286796bdd60f5ca1a92d4146e5b))
* **terms:** enhance terms retrieval with locale fallback and seed multiple languages ([f1fcdc4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f1fcdc47827c658f68b9c4eb0c626b33e4b9b2b2))
* **terms:** implement language validation for terms acceptance ([5a58894](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5a58894e223c480e76be8c9bd7b89ad73ee64d50))
* **terms:** update terms acceptance logic to be version-based across all locales ([e6f0540](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e6f0540c79149593fc934956b0976917ae75c5b7))
* **translations:** add German translations for Kodi city categories ([79ef591](https://github.com/The-Kodi-Suite/kodi.microservices/commit/79ef59100f6ac48ce1b01e0378ceaa30d6eceae2))
* **translations:** add success messages for category management ([5a5a24a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5a5a24aa0b02647878ea0c19ae95c0ca2910e262))
* **users:** enhance device deletion logic to support client deviceId ([6c3fd5e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6c3fd5ede0f5849a270961b3fdf3d982a6bf12dd))
* **users:** enhance device registration logic to reuse existing tokens ([9f5ca91](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9f5ca91bcb946db54433631bbb874bffabf6ec01))


### ♻️ Code Refactoring

* **categories:** clean up code formatting in category service and seed scripts ([58d2915](https://github.com/The-Kodi-Suite/kodi.microservices/commit/58d29159732be6be22995a725b02a6e8cf1ac626))
* **categories:** clear children for Events category in seed configuration ([e683355](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e683355cb43d79849735718d013dc9a00bfe07ca))
* **categories:** remove unused categories and streamline category assets ([d7e14c9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d7e14c97357f64df4768e930247407cfde9179a4))
* **destination-one:** simplify category assignment logic in destination-one.service.ts ([0353a38](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0353a38ec113625349dbd99fae3911d2699c7361))
* **destination-one:** update category mappings and remove unused types ([5202d45](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5202d4555599470494ad4120b821a8f6acc53476))
* **docs:** improve formatting and clarity in documentation files ([ed63bf3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ed63bf3af65b70b48edf986d1e1c53966d7ab8f6))
* **listings:** remove content search from listings service ([ababcda](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ababcdac39c453a7319d1633c719b9b93cd2485d))
* **notifications:** simplify language resolution in push notifications ([1a093fb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1a093fb3e26418c7565be61897b7de7fadcc324d))
* **notifications:** update event reminder messages to remove occurrence date ([321f1b2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/321f1b236f625d0adbf4ecfd6cae4c44f6e4cc41))
* **pagination:** standardize pagination logic across services ([592d028](https://github.com/The-Kodi-Suite/kodi.microservices/commit/592d028571bb11b141c3c75ce5a67b4ff1fe7048))

## [1.21.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.20.0...v1.21.0) (2025-12-01)


### 🔧 Chores

* **caddy:** add routing for pgAdmin SQL editor and enhance Redis Commander paths ([b81315c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b81315cc150aaafdcab01542102f6427fe32d340))
* **caddy:** refactor Caddyfile for improved routing and organization ([7916be7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7916be71d740a690ce4a7714f7e95b034f30b71f))
* **caddy:** update pgAdmin and Redis Commander paths for API integration ([344475c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/344475cafa29b14715e5d978defcd3f63c331aad))
* **docker:** enhance security by binding service ports to localhost ([435fa12](https://github.com/The-Kodi-Suite/kodi.microservices/commit/435fa12163b9b8edf01b4c85d7f27496e84e2f27))
* **docker:** enhance security by restricting port exposure in Docker configurations ([bd3d3dc](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bd3d3dc7c4c683ab628f8cb8b6a5e1f8f084b492))
* **docker:** reintroduce PostgreSQL port mapping with security notes ([a2d3878](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a2d3878104dfaab77474a5bb8d8d99d2e96463e1))
* **docker:** update pgAdmin environment variables for improved configurability ([fe989c0](https://github.com/The-Kodi-Suite/kodi.microservices/commit/fe989c06a22699a4e6ad6c1c9e7acdf4992e4205))
* **docker:** update Redis configuration for enhanced clarity and security ([4230799](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4230799afd4fa51197a8ce10c8b7dfabff193a3f))


### 🐛 Bug Fixes

* **docker:** restore port mapping for Redis service in development configuration ([69bc15c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/69bc15cdf61ad34048eabf12bbf8e2225fb999d0))
* **kodi-newsletter:** update email permission value for Double-Opt-In process ([18e796c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/18e796cbc13fb87749bbdd8e770972c516a40d72))
* **seed:** update Kodi culture category name and enhance category mappings ([827e0b7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/827e0b770e4f3ec3c39351752ae3d56dc485776c))
* **tasks:** handle potential errors when emitting schedule completed event ([1a6903c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1a6903c37290980a8f8e405f1cc39e125101b36f))


### ✨ Features

* **categories:** add logging for category translation and language detection ([81aa1cb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/81aa1cbe53ab857011593c3564ffeb0f3d9c5898))
* **categories:** enhance city category fetching with additional fields and overrides ([dc15f20](https://github.com/The-Kodi-Suite/kodi.microservices/commit/dc15f20be56ce3a912707b093c7c50d402713e14))
* **categories:** implement category filtering, searching, and pagination ([a8db061](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a8db06180d3d41b5c5bf37142f733d4d8e9022e1))
* **categories:** improve category translation handling with city-specific logic ([b39ae03](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b39ae038b420126050310f956837f5e06c839d1c))
* **city-category:** add methods for generating storage keys and enhance DTO with new fields ([cdc2be5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cdc2be5df7ac4ff6021dbd28cf9566f0a4eb1a8c))
* **city-category:** enhance category settings management with image and icon upload functionality ([111078e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/111078e864f9c271c28a056c1e9560bfaa36dacd))
* **city-category:** enhance CityCategory model with additional fields ([b4fbf6f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b4fbf6f6892649d07de14cfda9c946c175ecb035))
* **core:** enhance logging and skip reason tracking in reminder processing ([0ba5394](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0ba5394fd22a13be62e00688e51046614b798290))
* **destination-one:** enhance category assignment with fetched mappings ([4e2be1f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4e2be1fef5c871bdc2cba7efbf137e9343afab28))
* **destination-one:** enhance category fetching for multiple types ([28c1429](https://github.com/The-Kodi-Suite/kodi.microservices/commit/28c142937adb1472c93ccacff14ad292bc4be9ad))
* **destination-one:** enhance category matching for Gastro items ([0c882e2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0c882e205657b9695c968bdd84ede179cb40c409))
* **destination-one:** enhance category transformation with dynamic subcategory generation ([5ac8ffc](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5ac8ffc6c91da9cfee07e9442ffaef0a4976e790))
* **destination-one:** refine category assignment logic for improved accuracy ([633f4b7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/633f4b7964a86db4cc87571ad3c2c77c6cb8d1e8))
* **i18n:** add push notification default language configuration ([5ea6cb8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5ea6cb8e674271a644d3e998059eb547779208bb))
* **listing-update:** enhance UpdateListingDto with optional array fields for categories, cities, time intervals, exceptions, and tags ([331cf89](https://github.com/The-Kodi-Suite/kodi.microservices/commit/331cf89d266121be43852c671621959055076b42))
* **listings:** enhance image handling in listings service with default image logic ([bfc9800](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bfc9800e3f2483f746dc753af459ccdc67884d08))
* **seed:** add 'Show Me More' category and update Kodi city category settings ([6ca6a0f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6ca6a0f2083ea95613dddee269e4a0b700d8495a))
* **seed:** expand category values for shopping and city center ([4098f3f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4098f3fe6fe539e3ce6915f277d073c0a32b0a37))
* **seed:** reorganize seed commands for clarity and remove duplicates ([477a02e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/477a02e0f47030b4582ec9ecf718c9f68a222f33))
* **seed:** update category values and enhance category structure ([dfea556](https://github.com/The-Kodi-Suite/kodi.microservices/commit/dfea5563981150f484a1dbb833ef7cae9ce2aed5))
* **translations:** add auto-translation configuration for integration sync ([2c93a16](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2c93a16fcb37c8990b7666d1ab1580b8b5e5a82f))


### ♻️ Code Refactoring

* **categories:** improve logging and formatting in CategoriesController ([57c17e6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/57c17e637bc8d139278a86792712f23dbfaad095))
* **categories:** remove tours subcategories from quick filters configuration ([0276506](https://github.com/The-Kodi-Suite/kodi.microservices/commit/02765069838cbbe946a043ca13328e29ae80a372))
* **categories:** streamline category fetching logic in CategoriesService ([501f097](https://github.com/The-Kodi-Suite/kodi.microservices/commit/501f0978441a642bdd31943ee03064867f4eaa2e))
* **categories:** update display name for culture excursions category ([da31560](https://github.com/The-Kodi-Suite/kodi.microservices/commit/da3156079986d0fb4a0e726fb06a0698779f54be))
* **categories:** update quick filter terminology in controller, service, and DTO ([007cc28](https://github.com/The-Kodi-Suite/kodi.microservices/commit/007cc2854fa808c013cebb82266bd780a6c5f06f))
* improve code formatting and readability across multiple files ([388b4fa](https://github.com/The-Kodi-Suite/kodi.microservices/commit/388b4fa7acac004d3ca715b61620bc4b870fea27))
* **listings, tasks:** improve code formatting and documentation ([2bc504a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2bc504ad71c899cb92043c9c51f9e7b972ba8457))
* **listings:** simplify distance sorting logic in listings service ([b64cb06](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b64cb06220c0bca48d6ba00f27132e216652c216))
* **seed:** remove tours subcategories from Kodi city category settings ([c6c5964](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c6c59641a22fa16879522f7a528a4b92e0511b39))

## [1.20.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.19.0...v1.20.0) (2025-11-26)


### ♻️ Code Refactoring

* **auth, city, tags, integration:** clean up code formatting and improve readability ([f1c58ea](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f1c58eadf45e81fdbd3d258b197fc192253b4e58))
* **categories, listings, destination-one:** clean up code formatting and improve readability ([746f625](https://github.com/The-Kodi-Suite/kodi.microservices/commit/746f6258c8b575bad09d1699d4f17c428694240b))
* **categories:** update city categories response structure and remove deprecated DTO ([f18f6c2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f18f6c2707f114f345bc6dfc588f587a9a7b7fc2))
* **seed-all:** update pipeline data handling in seed-all.sh script ([305fea4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/305fea486f0353f93b9b6801f44761d900858ea3))


### 🐛 Bug Fixes

* **core, tasks:** streamline event occurrence logic and adjust task scheduling ([4662ddd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4662dddbeb5ea483712c36096d911193c8d1f89a))
* **seed-all:** improve error handling in seed-all.sh script ([0b6223d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0b6223db39d9ffc50ad972d945d5fecd2dad1eff))
* **tasks:** update task scheduling frequency from every 5 minutes to hourly ([91fae93](https://github.com/The-Kodi-Suite/kodi.microservices/commit/91fae9344e0167f9043ddfe413c1a23fecea4983))


### ✨ Features

* **assets:** add tile assets mapping and corresponding image files ([613b96b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/613b96b03be8a3746a26cda9ccfea70867cf1c42))
* **categories:** enhance city category listing and sorting logic ([cc7c923](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cc7c9231d04e2d39927f06c5c19e35b38ace051f))
* **categories:** enhance city category listing and sorting logic ([51e3d84](https://github.com/The-Kodi-Suite/kodi.microservices/commit/51e3d84b948836227fc72fb748baa5c8c53a1a61))
* **categories:** enhance quick filter configuration and response structure ([ca76cef](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ca76cef1990122b64e375fdee753d67a9da5918b))
* **core, integration:** add repeatUntil property to scheduling and destination interfaces ([e5e0c2b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e5e0c2b8f8f5fe8b198a74bd927f8fa180e93eb8))
* **core:** enhance category creation to include city mapping ([03e31e3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/03e31e3ce892c1488fd16f51922a16541ae7845d))
* **core:** streamline city-category mapping logic ([82b3961](https://github.com/The-Kodi-Suite/kodi.microservices/commit/82b39616f94250141408d96f279a4ac53376398f))
* **destination-one:** add calculateLatestEventDates method for event date calculations ([ec164d7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ec164d74682427edcafaf66bf59e184e533de565))
* **favorites:** enhance user favorites retrieval with filtering and pagination ([e3bd06e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e3bd06e040955a5ca7b04b2b1cdfd64d552f0e7d))
* **i18n:** add quick filter translations for multiple languages ([f408119](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f408119fe429a214a1638273d1a5805668a92006))
* **integration:** add IntegrationMessageController for RabbitMQ message handling ([aea901e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/aea901e49f8b75f009f4f36b88af88d9a81841a6))
* **listings:** add bulk media deletion and hero image removal endpoints ([6b94d00](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6b94d007591c198a696a515344baa31e37b69391))
* **newsletter:** update consent storage purposes format and improve language selector script ([c32ccb8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c32ccb8679e1abcc8bcb9adc8beaee6b7e5fe39a))
* **package:** add seed:all script for comprehensive seeding process ([14b8f0e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/14b8f0eee986faaa27a54c13d543dbe0211eb3a3))
* **preferences:** add user preferences DTOs for newsletter and notification settings ([b5c769c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b5c769c1ec5798a75e7da8febccbed95e51f583b))
* **preferences:** implement user preferences update endpoint for newsletter and notification settings ([88aecc8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/88aecc8d9e3e8eba6a55fdade25b9205d44b9a1d))
* **salutations:** add seeding script for multi-language salutations ([493862f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/493862f5f35d2ddc14527990c13dbd891c3dc1f2))
* **schedules:** add seed script for default schedules ([cb590a9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cb590a93aaee13ee4e1f14ae2b0208cfbd65b896))
* **seed-destination-one:** add daily sync task for Destination One integration ([0f02898](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0f028989788e7947b1860c685c96a5425d100b2e))
* **seeding:** introduce seed-all.sh script for comprehensive environment bootstrapping ([c808819](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c808819a4f7c9c5855c20b8171554246a7919528))
* **swagger:** enhance Swagger documentation setup across services ([81ace38](https://github.com/The-Kodi-Suite/kodi.microservices/commit/81ace3813f2e11efbfa596624527ac6a07c9e8e0))
* **tasks:** add cron helper functions for scheduling management ([ab8c363](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ab8c363fe516ddfe8a09c628d90f7e8b0f87c5a8))
* **tasks:** enhance task execution logging and error handling ([785a2f9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/785a2f92b33d0edc67b55541fca025d65ad5181e))
* **tasks:** enhance task management endpoints with detailed operations ([852299b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/852299b3d8e1682ba55675392f6eb6931dcf56c1))
* **tiles:** add upload scripts and enhance tile seeding process ([f976854](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f976854842203b32abc405cb208c9cb3e9094cca))
* **translations:** add DeepL retry configuration and translation concurrency control ([e1b4bd3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e1b4bd3b802827334d39f77bb39c3c0254cc9c40))
* **translations:** enhance translation handling with rate limit requeue logic ([d1999a4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d1999a44771e20a51ce30db47f3afc6ace3d438c))
* **translations:** implement concurrency control and rate limit handling in translation service ([6f1f2b7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6f1f2b701eecfcf429acee0e9180f7d9762e035b))
* **users:** add salutation and hasVehicle fields to User model ([2d5b9a7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2d5b9a776cc84b2a3b09b38d0c531d8c4217f621))
* **users:** enhance user DTOs with salutation and hasVehicle fields ([b0ae43e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b0ae43efe2f4fdd897beafd384bfb6b3f45f064f))
* **users:** implement notification preferences management ([6e984fd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6e984fd803b4e27259d97b42aa029eeb05e8a188))
* **users:** implement salutations endpoint and update user model ([bebf469](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bebf469a89975e9bbb1640569aa4a67cbafee68d))
* **users:** refactor salutation handling and introduce Salutation model ([59b793f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/59b793f008c1b8c3c940c7888c3e3ec69890df92))
* **users:** standardize salutation handling and introduce Salutation response DTO ([39be2dc](https://github.com/The-Kodi-Suite/kodi.microservices/commit/39be2dce1203e36a607ab1e5bb7d6fc97bb19969))
* **users:** update user DTOs and service to include salutation and hasVehicle fields ([130e661](https://github.com/The-Kodi-Suite/kodi.microservices/commit/130e66174e2f236e84bcd661eeb64905f3c19987))


### 🔧 Chores

* **dependencies:** update package version and add cron-parser dependency ([e9a9cc2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e9a9cc2b7294e26e783ef6ca8e372790ecab70e5))

## [1.19.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.18.0...v1.19.0) (2025-11-25)


### 🐛 Bug Fixes

* **core:** improve location and status handling in CoreService ([f19ef0e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f19ef0ed2bae8a849626ef2f7833315eb06fb9c0))
* **listings:** refine bounding box filtering and update total count logic ([a426a9f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a426a9f918dcd6f7e4b5c671d135c510efe8d828))
* **seed:** update city categories seeding script to use English display names for Kodi ([8dac104](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8dac1040726fe124598a691ba5477c24dabda467))
* **swagger-i18n:** improve onComplete function and component key handling ([b70fbd3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b70fbd360e2459e8f6ac447bfe956207ebcea8a9))
* **tiles:** update delete tile response and HTTP status code ([2d9ec53](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2d9ec53db46c18072e8919fed69dfb4b1d9de85b))
* **tiles:** update delete tile response and HTTP status code ([5e631d6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5e631d6317d83729698d4d0e23de0aa76b077902))


### ✨ Features

* **assets:** add category assets mapping and associated images ([5bbb3a8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5bbb3a8ff550f1e2118bbd8957909b9e228ba543))
* **auth:** enhance city admin assignment functionality ([9e07b1d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9e07b1d1a62082f4e887fdf80f765dd81349cd10))
* **auth:** enhance city admin assignment functionality ([7c8cdc8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7c8cdc825ee458257580ecf69d18669a852459f5))
* **categories, city-categories:** add languageCode support for category seeding ([4fa3d67](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4fa3d670748b596b4992cb44a2f63d143667fdad))
* **categories, listings:** enhance category and listing responses with quick filters ([5fd8cda](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5fd8cda3047f367dd74ef081dc83af594a04327d))
* **categories:** add background color and display order properties to category DTOs ([a197628](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a197628bf6888d81c10f53f899d397b8a3c5b33e))
* **categories:** add city categories with quick filters endpoint and service ([d608b5c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d608b5cb9f7534fbc3557e1636679ff2d46657a7))
* **categories:** enhance category seeding and asset management ([872df0e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/872df0eeac0b4d2170a429aa8fce2f57fff3ef05))
* **categories:** enhance category service to attach virtual quick filters as children ([b5936e6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b5936e66ac00ae9298813c2b868914fe98af4c59))
* **categories:** implement syncCategoriesFromIntegration method and enhance category management ([d2c61b8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d2c61b8a117a585bd27a6557e4ace020de1052b6))
* **categories:** inherit imageUrl from parent categories for children ([bbce7f0](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bbce7f01ef7d21d3947fce4165ca0ef0c3a4c0bf))
* **categories:** integrate translation functionality for category management ([4c2b0a9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4c2b0a991cbdea4485c3aac91fe1805d78c99c65))
* **categories:** update category handling to include display order and background colors ([f6d45df](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f6d45dfa7146772da9f755d7a9082418de01ae23))
* **city:** add header image upload and deletion functionality ([19a2cb3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/19a2cb3e4142dc9f08e7c70e5469efb7bcdf43f6))
* **city:** enhance city management with filtering, sorting, and logo upload functionality ([98de9e5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/98de9e5caf7617b76aa108e50b26285c442f4248))
* **core, integration:** enhance category handling and event facets integration ([3df369a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3df369aa518f2c744b582a09dbad3c8a30064d92))
* **core:** enhance CoreService with I18nService for parking space translations ([5d65f6c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5d65f6c636be54c08b08d4959180e9cd71cd505e))
* **destination-one:** enhance data fetching and tagging capabilities ([a0f6b2b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a0f6b2bb28bca735970d768805ee4c39a0148bfe))
* **destination-one:** update template and enhance data fetching with facet support ([452e75e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/452e75e68cfb1a01cc81218e74dd73befbcbdf87))
* **devices:** add device response DTOs for device management ([c8fd8e1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c8fd8e119d1571fb291cfffb06a0cde2d9856a39))
* **devices:** implement device and topic subscription management endpoints ([162bbcb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/162bbcbdc2f115079c3db9c42b16e657ca1fb070))
* **dto:** add category mapping configuration for Destination One integration ([730291b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/730291b55e1994b6b5173371fb29e3640bb5f15c))
* **errors:** add new error codes and translations for admin role requirements ([5f5534e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5f5534ea1374e4a247c76d157bccd4edf2289c31))
* **errors:** add new error codes and translations for admin role requirements ([2fd805f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2fd805f6073d9195df38abd5b1695ce77d2ac4fd))
* **firebase:** add Firebase project seeding script and update documentation ([67883d9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/67883d94dc9ca8062619fbb4f7bdfc1cd6523c63))
* **i18n:** add event reminder notifications in multiple languages ([5d16411](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5d16411a1fc21bd3f538996f4fccecfa004366ff))
* **i18n:** add notifications translations for multiple languages ([c2ac4a6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c2ac4a67c21958b1cd7ca1cdc18bc65aade11442))
* **i18n:** enhance error and success messages for listings in multiple languages ([b89567d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b89567d0bc21cf6a94ec8485ebb8612949c612f9))
* **i18n:** enhance multilingual support across services by integrating source language handling ([0c2ce7f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0c2ce7fe6b2e85a3db62eb8bab62c8430b3b6707))
* **integration:** enhance app module and integration controller for newsletter functionality ([f6dbbac](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f6dbbacedb75933c12a5aa3181fe7d78686c0084))
* **integration:** enhance DTOs for newsletter subscription and integration responses ([2aa53a9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2aa53a9e5cad1348f3a083781a39709ef4cf10d0))
* **listings, core, integration:** add eventStart and eventEnd handling ([f012608](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f0126080869feaf269df2cc10c9ca929a85a91f0))
* **listings, core, integration:** add mediaItems handling for listings ([0c0b795](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0c0b7958f65abb8f96b5bf6240c5ab6872be148e))
* **listings:** add CategoryQuickFilterDto and integrate into category response ([fa479d9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/fa479d9995aed55d712d9c0da19c1988a6f4e7f4))
* **listings:** enhance listing creation and update functionality with tags and improved validation ([b33ae9c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b33ae9c27d4874f2d3d99a6aed3b3a799ef58e85))
* **listings:** enhance listing creation and update with tag support ([1905353](https://github.com/The-Kodi-Suite/kodi.microservices/commit/19053534856e473773c90549a7c51646ff55eb5d))
* **listings:** enhance listing service to include tag translations and update DTOs ([c79b493](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c79b4933df4a595010b47bf68b85d3da9fb02e47))
* **listings:** implement multilingual support for listings with translation integration ([efdc162](https://github.com/The-Kodi-Suite/kodi.microservices/commit/efdc1624c7694358423a25c39f4e88a11c49a02d))
* **listings:** implement nearby filter validation and distance-based sorting ([4233787](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4233787f3d67f67f7c964657c3789881c417cb2e))
* **listings:** update quick filter DTOs and enhance category response structure ([15d8d32](https://github.com/The-Kodi-Suite/kodi.microservices/commit/15d8d326c4600350aba8a9214269a17aa4f934cb))
* **listings:** update quickFilter property in ListingFilterDto to support new values ([2f54fee](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2f54fee8391f1a37a1d5719963dd47bd83a1bc24))
* **newsletter:** enhance KodiNewsletterService for improved contact creation and event triggering ([06407a2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/06407a214137546e144840f70100cc1774355739))
* **notification:** add EVENT_REMINDER to NotificationType enum and migration ([c335e7f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c335e7fc20b48695b78ad062bcb49aaf023c73f4))
* **notification:** add EVENT_REMINDER type to SendNotificationDto and update RabbitMQ patterns ([e4edcf7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e4edcf786ee14221edd1647f0071a39495a13d5b))
* **notification:** add scheduleRunId to Notification model and migration ([13c0b2c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/13c0b2cb01d009da479826f3bd23d9aca1f26039))
* **notification:** add upsert endpoint for city-specific Firebase project management ([5eaad86](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5eaad865c6c7f2f9e3555b4c6b4c50b3d54fade7))
* **notification:** enhance FCM push notification handling and token management ([bcb9795](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bcb9795d20b0a1cdcd0d9575d6e84d8075427272))
* **notification:** enhance Firebase credentials decryption logic ([76c8505](https://github.com/The-Kodi-Suite/kodi.microservices/commit/76c8505affa5bf13caf0337020fb667bcc254fc6))
* **notification:** enhance Notification model and introduce FirebaseProject model ([db590b6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/db590b6499562ebbe38b52716e1745f1d1db2f98))
* **notification:** enhance notification system with push notifications and bulk management ([3d95ae8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3d95ae884574dd4a86b8c0054a786c8fb44354e9))
* **notification:** extract and manage scheduleRunId in notification creation ([b283b57](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b283b572194edf9a07345c6822fc35138e3cc7b8))
* **notification:** implement FCM push notification and translation services ([1b53c81](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1b53c81d21336277a70fd6857ba71c4b1b50cb01))
* **notification:** introduce BulkNotificationDto and FirebaseProjectDto for enhanced notification management ([5c345f3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5c345f3d244068bb955836c79195f4a4775db519))
* **package:** add Firebase project seeding command to package.json ([6525058](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6525058957978b07e1f4eb4bcaeb8f6ac8a05348))
* **rabbitmq:** add new user device and topic subscription patterns ([83457cd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/83457cd76080f004dffd908097f04364d6d821c3))
* **reminders:** add ListingReminder model and associated enum for push notifications ([7099d94](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7099d94d15a10fc8e6eecd0cd525afe30b96b982))
* **reminders:** implement favorite event reminders processing and notification emission ([9381f97](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9381f9762b4aa97a7c4d7e551fb79de10c61b435))
* **reminders:** update favorite reminders processing to include scheduleRunId ([cc03152](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cc031527b7ca0c3f69b49f8f09dcd96e4acf352f))
* **scheduler:** add ScheduleRunLog model for tracking scheduled task executions ([fbf0a4c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/fbf0a4c5ee6846cf5e0ee3689418b5c0674b2a10))
* **scheduler:** enhance task execution logging with ScheduleRunLog ([8a7966f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8a7966fbc259824178c756b1b1eb1102c9c68b5e))
* **schema:** add languageCode field to models for multilingual support ([1a0c287](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1a0c2875104f029fca37a5f19d5fb8941b6acd88))
* **schema:** add tagging functionality to listings and implement Tag model ([5889f82](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5889f82bfdc1c16bd8d3caa3215c91215ec16c39))
* **seed:** add tiles seeding script and update package.json ([252b900](https://github.com/The-Kodi-Suite/kodi.microservices/commit/252b900b4b48222def47ea8a451652be3d6009ea))
* **seed:** enable event category facets during sync ([809ea9b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/809ea9b280c4c93ad2d8f860e1f65d953d5a5864))
* **seed:** update category seeds and display names for Kodi ([31f9de8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/31f9de8bc1ffc80049561c3b1d8af7ef04ca1d74))
* **swagger:** enhance API documentation with multilingual support ([b088aaf](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b088aaffed5c131a298984cccba19b80c9e65a2a))
* **swagger:** integrate i18n options for Swagger documentation ([8ffc16a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8ffc16a2e2d85802ef1145a2b489d1de43bff525))
* **tags:** implement tags module with CRUD operations ([97028d5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/97028d5e212f64b78c92884af37deb7db9a91128))
* **tasks:** enhance task processing to handle favorite event reminders ([f754366](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f754366e45547a61b37abaf048d82e4a0415b41b))
* **tiles:** enhance TileFilterDto with boolean transformation ([1fd8768](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1fd8768454eefa57e0318cae19b220a4e2990e54))
* **tiles:** enhance TileFilterDto with boolean transformation ([297aca4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/297aca40cc91ebfc04ab7e71ca5d26f22d3ac378))
* **tiles:** implement multilingual support for tiles with translation integration ([fc952ef](https://github.com/The-Kodi-Suite/kodi.microservices/commit/fc952ef74be22af3172d8faeee827c47c67c0b2e))
* **translations:** add AutoTranslateFieldDto for translation requests ([f02ec6e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f02ec6e1ddcaa3bad0933d443f66a76fe2958ec8))
* **translations:** add DeepL configuration for automatic translations ([4242767](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4242767be566eef206c11257cfab952522c011a2))
* **translations:** add Translation model and migration for multilingual support ([5ab46c6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5ab46c64a5746987ed047a9c854dfbaee238cb49))
* **translations:** add TRANSLATION_AUTO_TRANSLATE constant for automatic translation events ([32e0bb8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/32e0bb883001991cea21408b48fe69dad55b0296))
* **translations:** add translations library configuration and documentation ([37ca1f1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/37ca1f1532d73f06449f81ece3ff1f8a500f7bf5))
* **translations:** add TranslationsModule and TranslationHandlerService ([f0fd34a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f0fd34ae8e7df137633cefabf06c2efc5a4f3179))
* **translations:** implement source language tracking for accurate translations ([a96674d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a96674d13b251cf091fbdaf33e6ddb9b2498d190))
* **translations:** implement TranslationModule and related services for multilingual support ([1f37211](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1f37211687340b8ef6a4d3df704eb47fb44af74c))
* **translations:** integrate TranslationModule and enhance CoreService for automatic translations ([60c4592](https://github.com/The-Kodi-Suite/kodi.microservices/commit/60c4592d2169cce7a5141bf22cb50183e286ae47))
* **user:** add new preferredLanguage field to UpdateProfileDto and extend RabbitMQ patterns ([626c7d6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/626c7d6e949264e96b1e861bba7d1d47dc6a5284))
* **user:** add preferredLanguage field and index to User model ([8e89d42](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8e89d42cc3359755194d2e1de8b837007bb2a232))
* **users:** add restore user functionality for Super Admins ([e8d1362](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e8d1362d559edcdcb48931b447776cf8b87d6d96))
* **users:** add user search by city and retrieve all active users ([95bfa73](https://github.com/The-Kodi-Suite/kodi.microservices/commit/95bfa737f8681dbdb3cb75ab96ad7cb0bd61607e))
* **users:** add UserDevice and UserTopicSubscription models for push notification management ([0422055](https://github.com/The-Kodi-Suite/kodi.microservices/commit/04220555b0816b64395c2aed020f1afe6e5df334))
* **users:** enhance user retrieval with filtering and sorting capabilities ([16113d7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/16113d757b08ae66d20705094687df0ae8fd81dd))
* **users:** implement user restoration feature and update translations ([478ae83](https://github.com/The-Kodi-Suite/kodi.microservices/commit/478ae8381b816db3410ab2f7cf64098a745d1073))


### ♻️ Code Refactoring

* **auth, devices, topics:** streamline DTOs and controller methods ([31c10c2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/31c10c2fbfe459163deb34d1cc5a32bf26c02620))
* **categories, listings:** clean up unused imports ([3819ac2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3819ac273e3da68c740c3d35d1c7cf7b12f15937))
* **core:** remove categoryMappings from syncCategoriesFromIntegration method ([0cdc46f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0cdc46f311468153c0d0c35b224c86f40aa450f8))
* **core:** remove syncCategoriesFromIntegration method and enhance tag syncing ([d7cbf1f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d7cbf1fd8800196a92961e55f2611992068ac52b))
* **destination-one:** enhance API call tracking and category mapping logic ([01db18d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/01db18d5266f095eb860d6cb11800e5c3966589b))
* **destination-one:** improve content extraction logic in DestinationOneService ([65ce1c1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/65ce1c1508f601bc0629391fac3ac333ea066d74))
* **destination-one:** streamline category processing and remove categoryMappings ([08f5501](https://github.com/The-Kodi-Suite/kodi.microservices/commit/08f550148c7be217f9bf87cdd547b3bfcb3b9990))
* **destination-one:** update sync hash generation to accept title, summary, and content ([69fb2b7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/69fb2b70fc5b3fd2707cf8a1690213464af4c712))
* **favorites:** update favorites endpoint response structure and DTOs ([cd65c63](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cd65c63584b48ca03cb6683f5a5b8d7dda923f3e))
* **listings:** improve error handling and success messages ([890d942](https://github.com/The-Kodi-Suite/kodi.microservices/commit/890d94226d749a6414ea041fd8136d88342a1f34))
* **seed:** remove required env vars and implement user and city retrieval ([b074f59](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b074f59bb725d50c595d4ba2bf82a18142eed3a8))
* **tags:** standardize provider value and update DTOs for tag creation and response ([3d9312a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3d9312a05fd148f54d672924760da54f8d5b6477))
* **translations:** change TranslationHandlerService from provider to controller ([40e4ec7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/40e4ec74637c25cf050e8bd022d6627cd3303eee))
* **users:** remove debug logging from findAll method in UsersController ([70289ae](https://github.com/The-Kodi-Suite/kodi.microservices/commit/70289ae6423d3fff63495c3ec3f03dba098ecf7c))


### 🔧 Chores

* **env:** remove .env.backup and update .env.example with new configurations ([71adaac](https://github.com/The-Kodi-Suite/kodi.microservices/commit/71adaaca472307cef0dfd68f603672355703e3c0))
* **package:** remove prisma studio script from package.json ([c54a41e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c54a41ef7b45a3d4ac52bfdd0c1ab70b36053fa5))
* **vscode:** update settings to pin Prisma version ([28c4b51](https://github.com/The-Kodi-Suite/kodi.microservices/commit/28c4b51c6edb3f7574db74227a44f6e5100a26cc))

## [1.18.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.17.0...v1.18.0) (2025-11-17)


### 🐛 Bug Fixes

* **docker:** update healthcheck commands in docker-compose.yml for improved reliability ([26dea68](https://github.com/The-Kodi-Suite/kodi.microservices/commit/26dea68233d241582b8ebfe753249b342aa72d5c))
* **rabbitmq:** update integration sync listing constant for consistency ([bc209f1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bc209f1feb3dc5dccb06f704c7dbba5e25f058cc))


### 🔧 Chores

* **docker:** configure pgAdmin for reverse proxy support in docker-compose.yml and Caddyfile ([8f4109f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8f4109f9a6bd99beedced78412ce51148908fe6c))
* **docker:** refine volume configuration in docker-compose.yml ([1bc871e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1bc871e6947892deacab195e37d70b30db5b448a))
* **docker:** update healthcheck command for Caddy service in docker-compose.yml ([9797a0d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9797a0d3ccfe5279d0938169fb8819420dc9d666))
* **docker:** update healthcheck command for redis service in docker-compose.yml ([223de35](https://github.com/The-Kodi-Suite/kodi.microservices/commit/223de35ff89d77ffc28d10bd8310a190ca3e3fd9))
* **docker:** update pgAdmin volume configuration in docker-compose.yml ([de3612b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/de3612b742cae8c6bfa8f9ce771ed816437b1563))


### ♻️ Code Refactoring

* **categories:** clean up API operation descriptions and streamline imports ([a621ddb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a621ddb19add6f4e1361ea40c904078424e931cd))
* **config:** streamline KodiNewsletter configuration retrieval ([5a3984b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5a3984bcd7d68615fcf8cc60795c80feddd8b267))
* **docker:** remove permissions fix script from pgAdmin configuration in docker-compose.yml ([60d8d6f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/60d8d6fa530d2c20ea71b977ce2dc1289a0083c3))


### ✨ Features

* **categories:** implement image and icon upload functionality for categories ([062832b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/062832b6cd0209041b7d3ad22b9a40cdcaaead4f))
* **docker:** add permissions fix script for pgAdmin in docker-compose.yml ([d82ed22](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d82ed22ce6bd0928d4524c614c795399c651afe8))
* **favorites:** implement toggle favorite functionality for listings ([670b06e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/670b06eab0cc4ebfafffc3a2b15c115ba5e7374c))
* **integration:** add Kodi Newsletter integration and subscription model ([63bc1cd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/63bc1cd0eb0b9d302735c19973b32031bb92bcce))
* **integration:** add KodiNewsletter module and service for newsletter subscriptions ([ca7187b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ca7187b4950236dfebd71db9b56ee39f05661a19))
* **integration:** add Mobilithek Parking integration seeding script and configuration ([ff6303d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ff6303de4fedd357b06090f09f77d8843ca20eb2))
* **integration:** add MobilithekParking module and service for parking data integration ([f39335e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f39335e3039db6a6764a3cd691c03e5b3000d04b))
* **integration:** implement newsletter subscription endpoint and service integration ([c3457de](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c3457de9005d56d800c45674bcf7718d32c178f5))
* **integration:** integrate JWT authentication and enhance access control ([d5baa5c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d5baa5c4533a09ac5afddcc47c4b4b4a45aee5c6))
* **listings:** enhance listing retrieval with user favorites ([11b67e9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/11b67e910788be6f61cf2b5e93567f795fcd605b))
* **parking:** add ParkingSpace DTO and update integration exports ([e234200](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e234200f88ef7dbf46f727219038dbed632c534e))
* **parking:** add ParkingSpace model and Mobilithek integration support ([c2e55ad](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c2e55ad114b7420ea8e0030c4593cd9f2b72d5a3))
* **parking:** integrate parking space synchronization and retrieval ([a4f2634](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a4f2634f5d3329893def4c5f6e6f6351902530a9))
* **seeding:** add city categories seeding script for Kodi ([aaf4966](https://github.com/The-Kodi-Suite/kodi.microservices/commit/aaf4966e8e97ee06d8813b25582857fccd9db105))
* **seeding:** add new seed scripts for Mobilithek Parking and Kodi Newsletter integrations ([c1cbe4e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c1cbe4e914fcb8402a3ff8013f343f3f1c837d59))
* **seeding:** update seed scripts and improve environment variable loading ([9df26cf](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9df26cf1d9f17c4a607ba31066b2732b44dc3fba))

## [1.17.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.16.0...v1.17.0) (2025-11-16)


### ✨ Features

* **infrastructure:** implement data persistence and backup functionality ([fbce5d2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/fbce5d2e0538730439ff717aec5bd499d33c3977))

## [1.16.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.15.0...v1.16.0) (2025-11-16)


### 🔧 Chores

* **package-lock:** remove peer dependencies and update devOptional to dev for several packages ([e70707a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e70707a19c8e53be29e7e15604390b68a41a425f))
* **release:** 1.15.0 [skip ci] ([cf95160](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cf95160c6fdcf2f694634bf80bed1c8bd4a411f6))


### 🐛 Bug Fixes

* **package:** update dev:all script to include integration service in concurrent development setup ([635ee0e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/635ee0ecfbaf2220f9b8035a76a49ba26adb9e66))


### ✨ Features

* **auth:** enhance login error handling with detailed responses ([1bf3abd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1bf3abd2a3a0cb9646cc10d00d47b603c44d12ca))
* **auth:** implement non-blocking terms acceptance check during login ([df220d6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/df220d6334228a303958cd14ea261a5b1dcf77d7))
* **categories:** add updateDisplayName endpoint and enhance category assignment ([4cac83c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4cac83ccfde73c785ce9654c60f5106ecfdbc980))
* **categories:** add updateDisplayName endpoint and enhance category assignment ([0b2dc79](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0b2dc79c6259829fff104f49c0bb41ed09f962a8))
* **categories:** enhance error handling and update category-related DTOs ([b998b27](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b998b2733ffc50c5c3dd8048826d902f65cca026))
* **categories:** implement category retrieval and hierarchical structure ([631e177](https://github.com/The-Kodi-Suite/kodi.microservices/commit/631e17728895801bf8ae95d68af9a6ba678568bd))
* **categories:** implement category retrieval and hierarchical structure ([25d8cfa](https://github.com/The-Kodi-Suite/kodi.microservices/commit/25d8cfa65f304c89b0557df688a0d48ecc8b5d0c))
* **categories:** implement hierarchical category structure and enhance category retrieval ([3a91bf6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3a91bf6bca844d576f2d7871025debc0996a030d))
* **city:** add CityMessageController for handling city-related messages ([a812319](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a812319fce29fd25345cfd985e473914b6d35b4a))
* **city:** add email theme metadata to Kodi city record ([3dec15a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3dec15a751af74272a1feba87ae7903cbd633ae2))
* **cityCategory:** add displayName field to CityCategory model and update migration ([f7771b9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f7771b95c3d40b4adf90a70d6150193ba1e5dc17))
* **city:** enhance city module with Swagger documentation and new features ([10fe847](https://github.com/The-Kodi-Suite/kodi.microservices/commit/10fe847f6d0beb94ce7ccf30c84da2d9862033cc))
* **city:** refactor city DTOs and introduce new response structures ([a5c434d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a5c434db4362826d07eee6144e3bf3aeb42bc67d))
* **dependencies:** update file-type package and add new dependencies ([ca352ea](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ca352ea60f3b023f1bf79f7ae2f4ad6b38210720))
* **dto:** add new integration response DTOs and update exports ([6e9c74e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6e9c74e088500289220abf33f7e1b2c0e92a972a))
* **dtos:** add new response DTOs for media uploads ([e71c9b0](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e71c9b08e449535314ecd20ee086a360f18a84ea))
* **dto:** update integration DTOs and restructure exports ([5488fab](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5488fab772fef06b93ad0f18ffda460b9afd8f94))
* **i18n:** add new error messages for account management across multiple languages ([1da4b61](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1da4b61cdb2c21a7ae08836702d6f90d9f260d2e))
* **i18n:** add new tile-related error messages in multiple languages ([61d687c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/61d687ce141500a6686707e7206e7b3dd8880738))
* **i18n:** update email verification subjects to include app name ([c30e1f4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c30e1f46a776a1de97d002a8614fff8c5e23ba18))
* **integration:** add DESTINATION_ONE to IntegrationProvider enum and update migration ([5887691](https://github.com/The-Kodi-Suite/kodi.microservices/commit/58876916de10910a8fc3bdd8efd22b07faac7523))
* **integration:** add DestinationOne module and service for API integration ([2bc4340](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2bc4340bc5335e3a23a10ac63abb561adb538c69))
* **integration:** add seeding script for Destination One integration ([046bb8b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/046bb8b50c5d165221c5a5fa05cc7bd06ced78eb))
* **integration:** enhance main application setup and add Swagger documentation ([55b1bfd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/55b1bfdf6eb3fbeea2a989bf78bf6f6791d42349))
* **integration:** implement DestinationOne service and update integration module ([a638787](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a63878715a185be7e15268741759751a987616fa))
* **integration:** implement paginated data fetching for Destination One service ([cf991af](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cf991af2f940a55d9697305efff171c78c8ff5ee))
* **integration:** implement syncListingFromIntegration method and update CoreMessageController ([25b683f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/25b683fc284cd335a61a29ff38ae92d03d6a1dfc))
* **listings:** add DeleteMediaResponseDto and update index file ([d05f99e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d05f99e6132e0b37ab5c79436d5b28b53399fdba))
* **listings:** enhance listing creation and update DTOs with new structures and validations ([d5baaed](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d5baaed7268237be8e347fb2d4c65b631dfa5419))
* **listings:** implement media deletion functionality in ListingController and ListingsService ([a0d120a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a0d120adbb603ed72d8e9ca722c04dc4232e057d))
* **listings:** implement media upload functionality in ListingController ([f0b31c5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f0b31c53cc45eaa6847708fe4239644562463430))
* **migrations:** add initial migration for tiles and tile_cities tables ([1872bdb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1872bdbea56ffc2da2d150ca9f7d21339a751b88))
* **notification:** add cityId support and CityEmailThemeService for email customization ([919fd34](https://github.com/The-Kodi-Suite/kodi.microservices/commit/919fd343785e28ff0ed65e1087cc2caebf24eb98))
* **notification:** add default email theme configuration ([849f7ff](https://github.com/The-Kodi-Suite/kodi.microservices/commit/849f7ffac87f58e5ca5aacab87dfcfe9853e27e3))
* **notification:** add SendNotificationDto for structured notification data ([34f9f53](https://github.com/The-Kodi-Suite/kodi.microservices/commit/34f9f5349a57a9d6cc7db4e54f6812944b8ed4a6))
* **notification:** enhance email verification with city-themed customization ([89ec872](https://github.com/The-Kodi-Suite/kodi.microservices/commit/89ec8723fd226680b48b9115ef324957943c0c65))
* **password-reset:** add password reset functionality with request and confirmation endpoints ([4258989](https://github.com/The-Kodi-Suite/kodi.microservices/commit/42589893cb8f18ebdfd15c330d5bbaff6d5c94d9))
* **password-reset:** add password reset functionality with request and confirmation endpoints ([f1fc446](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f1fc446888e0f9605e1217f8cde387b792cc181b))
* **password-reset:** implement password reset configuration and localization support ([83cae22](https://github.com/The-Kodi-Suite/kodi.microservices/commit/83cae229126a236d3a35a5db69676598369f4842))
* **password-reset:** implement password reset configuration and localization support ([76ee6a2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/76ee6a2b1631587811241985ea60142c8a3d1641))
* **password-reset:** implement password reset module with email functionality ([b451459](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b45145990103c3641804bcba5c08008930ea121e))
* **password-reset:** implement password reset module with email functionality ([a17b9cb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a17b9cb77925f37a0e60599baf5194633e77228c))
* **rbac:** add role utility functions and update guards to handle numeric user roles ([1ab0ffa](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1ab0ffadbc5a924034b8ac60a7b8ceaf130db0dc))
* **storage:** add AWS SDK for S3 and update storage configuration ([27a876a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/27a876a4ddc24a2debc2436cfd633ffff4656f14))
* **storage:** add Hetzner Object Storage configuration ([9e7ac54](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9e7ac54b0bf7104b39b7c3a66ba437111671c877))
* **storage:** implement file upload service for image, video, document, and audio processing ([a67f2a6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a67f2a6c7b251ae0c72419fdf33daa6e0ce866cf))
* **storage:** implement Storage module and service for Hetzner Object Storage ([84d8d2c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/84d8d2ce04fada156b328b5c395fe976d0ed2b63))
* **tasks:** enhance task execution logic to support integration sync ([bc81cb7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bc81cb7b5e36d48e8d370ae8329c795222817db9))
* **terms:** update guest user terms acceptance handling ([9bda015](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9bda015363473df1f7add9c20bb46ca8ed36ea49))
* **terms:** update guest user terms acceptance handling ([c090aea](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c090aea33b8c97080d452ecc61dbfa4eec363ab1))
* **tile:** add Tile and TileCity models with permissions for ad management ([12a55c6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/12a55c6b24b0db0d120cef28bc18ef65c463c71d))
* **tile:** add tile-related DTOs for managing tiles and their associations ([23b9f3e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/23b9f3ee448f16a799279f0002532d4fd0123459))
* **tile:** implement Tiles module with controller and service for tile management ([b4e9ffd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b4e9ffde62aff1cf1d70e6edb2d4c0a9e002bdb1))
* **tiles:** add background image upload functionality to TilesController ([85fe8d0](https://github.com/The-Kodi-Suite/kodi.microservices/commit/85fe8d0f7bda75dc1dd8efcec521eac6c4c25a9e))
* **tiles:** add icon image upload functionality for tiles ([085658a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/085658a616b42cc0d960dd2f774e5ad95f61585e))
* **tiles:** add icon image upload functionality for tiles ([c152161](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c152161c84800ec2cac2b768d352ae3aad30b780))
* **tiles:** add new response DTOs for tile operations and error handling ([4724798](https://github.com/The-Kodi-Suite/kodi.microservices/commit/47247989ebfeb164f8c0850ef595f0dd9203dca1))
* **tiles:** add search filter for tiles by header, subheader, and description ([4e436ed](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4e436ed28c5b94c14241c686142de09d57a3ded6))
* **tiles:** add search filter for tiles by header, subheader, and description ([37de5ab](https://github.com/The-Kodi-Suite/kodi.microservices/commit/37de5ab465168c3cf11017a54572ef3b81f6e0e4))
* **tiles:** enhance background image upload and management ([2b28a00](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2b28a0053903b24df65bee37a084ebe224acf532))
* **tiles:** enhance tile creation and update DTOs with new city reference structure ([566ecd1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/566ecd1ac3b18f62e2b2f2e9a78bc88cd4cf3265))
* **tiles:** update response DTOs and refactor controller methods ([ba5b6b6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ba5b6b65083cbe57633ef9bd139a40f9611540d0))
* **users:** add profilePhotoUrl column to users table ([4179b7c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4179b7cd12e4d92d4b1fb4dc530f954f3d4eb760))
* **users:** convert user roles to numeric values in user retrieval methods ([4581e3e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4581e3efb0fb3597bef20b9dfd0d7b7c3cf14d8d))
* **users:** convert user roles to numeric values in user retrieval methods ([7dc19b1](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7dc19b14492f27bfdfdd3ff1f53ee83ba3416cf8))
* **users:** enhance profile photo upload and response structure ([5744e05](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5744e05dee65c1ff669947c8fc5f6b7564bafbda))
* **users:** filter user retrieval by userType in UsersService ([95911a0](https://github.com/The-Kodi-Suite/kodi.microservices/commit/95911a07f16c7bdfa0056700353caa69ed8a2e95))
* **users:** filter user retrieval by userType in UsersService ([06cd9f3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/06cd9f394024f5d8eddde87973395a4736045dda))
* **users:** implement profile photo upload functionality ([d12317f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d12317f506914f68b5b81f5ef9c19dba7ad1d872))
* **users:** include cityId in user data handling ([6cfb772](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6cfb772ffccc664123d59c1f8c1d74136c3c20b3))


### ♻️ Code Refactoring

* **auth, users, listings, tiles:** standardize role handling to numeric values ([ed4eaf9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ed4eaf924e90baa82da506aeb1b1b71b758494ea))
* **categories:** simplify category hierarchy building and remove unused methods ([84cf589](https://github.com/The-Kodi-Suite/kodi.microservices/commit/84cf5897fb4fbc9a1ee52a0c5d63f5340c5e6bdf))
* **categories:** streamline error message formatting in CategoriesController ([e664038](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e6640381e9119a71972a54a953b5ecac60964b99))
* **dtos:** improve formatting and organization in tile DTOs ([57448bf](https://github.com/The-Kodi-Suite/kodi.microservices/commit/57448bf6147f0f293f9efabcb318655619034a37))
* **dtos:** standardize ApiProperty formatting and enhance documentation ([9d8ad7f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9d8ad7f16d91d93bbe4ae5bc7517acb0cfa88499))
* **dto:** update user role representation to numeric values for consistency ([e81c26c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/e81c26c024c8ebd497b77b3c8ef35c383fbc0ee8))
* **errors:** format translation calls for improved readability ([84760ca](https://github.com/The-Kodi-Suite/kodi.microservices/commit/84760ca3489fcfe1704b435fe2b8bedc7a8a2abc))
* **favorites:** streamline error message formatting in FavoritesController ([f2920d2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f2920d2b328e761d9a924dcc8101655f8f9ac08e))
* **integration:** remove DestinationOne service and update integration logic ([ee4c68a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ee4c68abe4d7bba49e699f850410d5dc87dcef15))
* **jwt:** update role handling to use numeric values for improved consistency ([b1b278d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b1b278d4fd13f7817577c84080712511b208c526))
* **notification:** clean up code formatting and improve readability ([a4c0b12](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a4c0b1273476555c0883a6f82efbed230c820f92))
* **notification:** migrate SendNotificationDto to shared contracts and remove local DTO files ([5fe83fd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5fe83fdcfe513f0a7c5c806d577bab360d785e37))
* **tiles:** remove backgroundImageUrl from CreateTileDto and UpdateTileDto ([0a0ebba](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0a0ebbaa6795dc3a55d71945c1970e26fc43ecab))
* **tiles:** simplify user ID retrieval and streamline error message formatting ([82510ae](https://github.com/The-Kodi-Suite/kodi.microservices/commit/82510ae2957733edf5a4678cf98189d8e6b2ae81))

## [1.15.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.14.0...v1.15.0) (2025-11-12)


### 🔧 Chores

* remove PM2 ecosystem configuration and related scripts from package.json ([7a17fbd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7a17fbd639b29f86a48791cbe4d242040a66475c))
* remove PM2 ecosystem configuration and related scripts from package.json ([bf04038](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bf0403881948fb9818f49981a3e25792fe17ebd8))


### ✨ Features

* **auth:** simplify login process to email-only authentication ([7abcee5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7abcee53de9efe2fe865a36368b0ba2221852218))
* **caddy:** add React frontend support and update environment variables ([ca607b7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ca607b77d7151dbaa3f822f72c45deba99fc1591))
* **categories:** enhance CategoriesController and CategoriesService with city-specific category management ([db6e6d4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/db6e6d4508d0c70020dbe3b51188cfae81b2849d))
* **categories:** enhance CategoriesController and CategoriesService with improved API documentation and request handling ([45a7f87](https://github.com/The-Kodi-Suite/kodi.microservices/commit/45a7f871b25e72e2d959d0681d0c8e6524987e82))
* **categories:** implement Categories module with CRUD operations and admin access control ([556438b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/556438b043fcadcbe163fc50ee213581f655128d))
* **categories:** integrate RBAC and JWT for enhanced access control in CategoriesController ([d7c87a2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d7c87a2b8f26519b95bef1c076d1470dee8524ea))
* **categories:** update error handling and enhance app module with new interceptors ([f1b2368](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f1b236805348c202840ae859c06703db7af2f953))
* **core:** enhance CoreController and CoreService with detailed API documentation and DTO integration ([8f15d7a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8f15d7add6847846938383d51e4973c661066bc4))
* **core:** integrate Listings and Categories modules, enhance Swagger documentation ([f28eb01](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f28eb01319ae6e53b2d242634d69d9e94e620e0a))
* **docker:** add Windows-specific Dockerfile for NestJS microservices (for development only) and enhance i18n service translation path handling ([aa9f428](https://github.com/The-Kodi-Suite/kodi.microservices/commit/aa9f428de0a40b8ba19d6401987c5a262fa6ed84))
* **docker:** add Windows-specific Dockerfile for NestJS microservices (for development only) and enhance i18n service translation path handling ([96ed65f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/96ed65fe7354a87181ff1f29513cc3514b2a1322))
* **dto:** add core and category response DTOs for enhanced data handling ([9989b68](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9989b685fc0d8df8e039450dbe986016e6a90a08))
* **errors:** add new error codes for verification and category-related issues ([899cd55](https://github.com/The-Kodi-Suite/kodi.microservices/commit/899cd551b7c7396c66a4643ae2f193f55609ef0e))
* **i18n:** add email verification translations and enhance error messages ([84681cb](https://github.com/The-Kodi-Suite/kodi.microservices/commit/84681cb4fbe8d1abd79334e29b2006c94a0739d7))
* **i18n:** add language support to user registration and creation ([59689d4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/59689d46740d5008056c1a7d1f703b89ce2d7e34))
* **i18n:** enhance verification process with language support ([1069147](https://github.com/The-Kodi-Suite/kodi.microservices/commit/106914755fab1e7338ba09695dbe57936efc0e8c))
* **jwt:** enhance JWT module and strategy with forward reference for RBAC and Permission services ([5040b8a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5040b8a50cbe06027644dde54305ba756bf353b7))
* **listings:** enhance FavoritesController and ListingController with detailed API documentation and DTO integration ([c67ec0a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c67ec0aa0c52ea2de5261250c3aec44c6b5980da))
* **listings:** implement Favorites and Listings controllers with CRUD operations ([ada7d55](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ada7d554e6a46e14ab3b68993755a54c793eedb2))
* **listings:** introduce DTOs for listing management ([edf483b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/edf483b70556e833674a118dcc90bb2558c23984))
* **migrations:** add initial migration for city categories and category requests ([87809e7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/87809e7a76b20f66ad51810ad6c0ae8927a1f986))
* **notification:** enhance notification module with error handling and new interceptors ([ee97ae5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ee97ae53e4509726b9f3185834b640bceb9473c3))
* **permissions:** expand permissions for city categories and category requests ([efca929](https://github.com/The-Kodi-Suite/kodi.microservices/commit/efca929a2cd66cd2ad14165a76b8af157b448e79))
* **prisma:** add CityCategory and CategoryRequest models to schema ([64861ff](https://github.com/The-Kodi-Suite/kodi.microservices/commit/64861ff9f8f1a4a0d1effcae96ae08797d691a98))
* **prisma:** enhance Listing model and introduce new related models ([7ff6ce5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7ff6ce5680c1a63b29b4c69e4bf4b429c6c269d7))
* **seeding:** add category and initial admin seeding scripts ([4b6b0d3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4b6b0d343cbf065dce10ce094f3554c984db3ff6))
* **users:** update user registration and conversion to allow optional username and name fields ([4c41024](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4c41024c7b561cb69318f70cc52147c9a07213b7))
* **validation:** enhance error handling and validation messages across user registration and conversion ([3df5248](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3df524818ee2001c967fd39b60899a384f05cf8e))


### 🐛 Bug Fixes

* **i18n:** update registration error messages to require only email and password ([4a9c8b6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4a9c8b6e004a8b5bf03727e82144da954d535743))


### ♻️ Code Refactoring

* **auth:** update DTOs for guest conversion and registration ([22572aa](https://github.com/The-Kodi-Suite/kodi.microservices/commit/22572aabb1ead55661d408b42a0664fd62a99841))
* **core:** simplify CoreController and CoreService by removing favorite management methods ([a6f3ac5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a6f3ac5a8b358f611418715ab608219abbfab725))
* **errors:** format translation calls for improved readability ([8dc22a2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8dc22a23d15ecd5dd50d177163dd519b9698d5c6))
* **prisma:** remove database connection logging for security ([7d74577](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7d74577b64c372ac4cc99439a4c93c72c7f9ffae))

## [1.14.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.13.0...v1.14.0) (2025-11-07)


### 🔧 Chores

* **dependencies:** migrate from Yarn to npm and update package configurations ([bb0ff84](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bb0ff84797571217829c4487fa2958f5def100bc))
* **dependencies:** update package-lock.json and yarn.lock for version bump and dependency adjustments ([5d66d0d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5d66d0defebb79418a2aaa0cc30a119c56cabcbc))
* **dependencies:** update package-lock.json and yarn.lock to remove peer dependencies and adjust dev flags ([3d5bdd6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3d5bdd6516ade9524546fb8b12d796c716b6c6c3))
* **dependencies:** update package-lock.json to remove peer flags and adjust dev flags ([c1ed350](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c1ed35013fe14b60e94ac924033324bd635de988))
* **dependencies:** update yarn.lock and enhance error handling in global exception filter ([eac62d9](https://github.com/The-Kodi-Suite/kodi.microservices/commit/eac62d959b52c3a8658d7fab4524621ed20e2cb1))
* **dependencies:** update yarn.lock to reflect dependency changes and optimizations ([d134440](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d1344405d4dd763b565e968f841d7265edacac52))


### 🐛 Bug Fixes

* **swagger:** enhance request interceptor for Accept-Language header handling ([aaa78c0](https://github.com/The-Kodi-Suite/kodi.microservices/commit/aaa78c0e07d8bb92f7ce9161fcf6d3d4771c9e51))
* **swagger:** improve LiveResponse component and response handling ([0e1e524](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0e1e52446a2b2fae97c26bd666e22b561c6f2b0b))
* **swagger:** patch LiveResponse component and enhance response interceptor ([75d46ea](https://github.com/The-Kodi-Suite/kodi.microservices/commit/75d46ea8cdac7910e9e37b23189bff7dd308ff11))
* **swagger:** temporarily disable i18n options in Swagger setup ([69269f2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/69269f2427bf232477a1d664710e2cf34da13dd4))


### ✨ Features

* **auth:** enhance API response documentation and error handling ([2ab0598](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2ab0598da2fa3595675e2da5c68f5ce1601ac42c))
* **auth:** enhance login functionality with remember me option ([aafad13](https://github.com/The-Kodi-Suite/kodi.microservices/commit/aafad13c423fe89c86527927df42da26952808ba))
* **auth:** enhance login process with email verification handling ([7dc288c](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7dc288c081bd859e556ccc843f3a6be4e5c6d042))
* **auth:** implement non-blocking terms acceptance check during login ([021f692](https://github.com/The-Kodi-Suite/kodi.microservices/commit/021f6929edb27f08a3b693d3e263fa2c6fe515f6))
* **auth:** improve email verification handling and error logging during login ([5181410](https://github.com/The-Kodi-Suite/kodi.microservices/commit/51814108e0b8483be0a42d3c0414c4c841b328b3))
* **config:** add API Gateway Base URL configuration and update email verification strategy ([8fce638](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8fce63800b8319c94e2803ff8a87a939ec3ef31f))
* **i18n:** add success messages and email verification error handling ([dc9f03d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/dc9f03d91b160e1e004511f8349f62acf91a6e30))
* **interceptors:** add SuccessMessageService and success message decorator ([7afd63f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7afd63feb1d7612e459b6e21f1a6a5cb239c4fbe))
* **notification:** enhance verification endpoints and integrate Swagger documentation ([efc86ac](https://github.com/The-Kodi-Suite/kodi.microservices/commit/efc86ac43a07d99709b344d5525b14e53aafd421))
* **security:** enhance helmet configuration and integrate i18n options for Swagger UI ([a2affd4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a2affd45bbddee6369ea2333b87de01476368532))
* **swagger-i18n:** implement dynamic language selector for Swagger UI ([29d1a46](https://github.com/The-Kodi-Suite/kodi.microservices/commit/29d1a46ee32b277df457463eb9cc72c533022b43))
* **terms:** add seeding scripts for terms of use and permissions ([44da0ff](https://github.com/The-Kodi-Suite/kodi.microservices/commit/44da0ff9a9ff0aa75b9beb3c365542925adde4c3))
* **terms:** add terms management DTOs and update login response ([17aaa86](https://github.com/The-Kodi-Suite/kodi.microservices/commit/17aaa863e347a6ac731d8af7d0c25a893ff885d9))
* **terms:** add terms of use configuration and i18n support for Swagger UI ([4023723](https://github.com/The-Kodi-Suite/kodi.microservices/commit/402372333b21d2f02ed5958f812a00e783b6cef3))
* **terms:** add TermsOfUse and UserTermsAcceptance models for terms management ([a24a226](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a24a226da1f74d8209e056e858e74a81d6c58aaf))
* **terms:** implement terms acceptance guard and related decorators ([86eb01e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/86eb01ed364dfc6dbb407e9e14fb41eb09bf8030))
* **terms:** implement terms management module with controllers and service ([cdc3b46](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cdc3b460d4aef4c8fe0e5cd405d696d66e35f2fe))
* **terms:** integrate TermsAcceptanceGuard across multiple modules ([71b6472](https://github.com/The-Kodi-Suite/kodi.microservices/commit/71b647220e94600f8fa78d029f479a2f62a5b169))
* **users:** add SuccessMessageService to app module ([2a9d8d2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2a9d8d2f65402a0c31688d939e8669a2eb750453))
* **verification:** add verification DTOs and enhance response structures ([8db88f8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8db88f89d7e9ea1dd7fb772e04467d50d3ae7ef0))


### ♻️ Code Refactoring

* **dto:** improve API property documentation formatting ([f0bb3bc](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f0bb3bc6f1f302a6b90fd1501955910b9f421017))
* **terms:** simplify terms controller responses and enhance response DTOs ([df47e85](https://github.com/The-Kodi-Suite/kodi.microservices/commit/df47e8533601f67301b6639c1056079f1ead5bd3))
* **terms:** update acceptance status endpoint to require authentication ([6326d50](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6326d50614949c4aa9838c4e9e66f47adf3ca9ca))
* **terms:** update terms controller and response DTOs for improved validation handling ([1e090a2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1e090a22e7689e3cc81c0f3031cb025dd99abe63))
* **users:** update message handling to event handling for verification ([5613c96](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5613c961f9e6150932b96ceb7e867ad83e492187))

## [1.13.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.12.0...v1.13.0) (2025-11-06)


### ♻️ Code Refactoring

* **dto:** remove common exports and delete common index file ([eae4abc](https://github.com/The-Kodi-Suite/kodi.microservices/commit/eae4abc6dd3b935de6a56110372fcfda6b391e30))
* **rabbitmq:** remove definitions.json and update documentation ([17f38fe](https://github.com/The-Kodi-Suite/kodi.microservices/commit/17f38fec063dc19431eb98262f68707e15f82b10))


### ✨ Features

* **auth, users:** enhance user and session models with device tracking and favorites ([70bcf38](https://github.com/The-Kodi-Suite/kodi.microservices/commit/70bcf387f36af6a919b184adc01159ef63c0e1c1))
* **auth:** add email verification check during login process ([682b5dd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/682b5ddf7c227f2dccdc74d238e0358702858b1d))
* **auth:** add guest conversion and login DTOs for improved user management ([d54b1c6](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d54b1c6cebbcb8191b00a285a5a1b940d477fb2d))
* **auth:** implement guest session creation and conversion endpoints ([c6d2b83](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c6d2b832fb48f4c7cce995ac3d1ae48b1b52a921))
* **core:** implement favorites management for users ([83bdd77](https://github.com/The-Kodi-Suite/kodi.microservices/commit/83bdd77fbc5a02c2e0506bdf03d3e1aaa4a37368))
* **email:** enhance SMTP configuration and email service ([d546579](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d546579b7ece68f7c85e723ed8b3e2bc48ab98e9))
* **notification:** add DTOs for verification processes ([66a6c47](https://github.com/The-Kodi-Suite/kodi.microservices/commit/66a6c47e2d68e1c9317bc4429507803e0734e503))
* **notification:** add VerificationToken model and related enums for email/SMS verification ([387c04b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/387c04b92f116c3686107c1e39b1b9b4a0086e2d))
* **notification:** implement email service and notification message controller ([83186f8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/83186f8c544bb8f2ccb1dc25c57db2af6ed3098f))
* **rabbitmq:** enhance RabbitMQ client and setup services ([0493b6f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0493b6f29897df9160b3de3c6a28fad5eb24525c))
* **users:** add CreateGuestDto for guest user creation ([8e9ff51](https://github.com/The-Kodi-Suite/kodi.microservices/commit/8e9ff51464f1f38cb4a06ff6a516daed2f832731))
* **users:** enhance user service and controller with validation error documentation ([9c8ab7a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9c8ab7ae06f5cb15ee5458317ac36bccc7705473))
* **users:** implement email verification handling and user service updates ([ea5b01a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ea5b01a69e68df657514c5afb070a79c2f242291))
* **users:** implement guest user creation and conversion endpoints ([c91b1f5](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c91b1f50aa29c3895a1de0d59614d2af0132e7d8))
* **users:** update guest user creation and validation response handling ([7407dda](https://github.com/The-Kodi-Suite/kodi.microservices/commit/7407dda1ef24fb1e0c8744570e0eeae0a2b82c40))
* **verification:** add verification module and controllers for email/SMS verification ([c43dbf7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c43dbf713729450483edb1ce782f933cf7552b6e))
* **verification:** implement email and SMS verification strategies ([c3f020a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c3f020a6f7cd81deef059ff1da2e462678e01273))


### 🐛 Bug Fixes

* **auth:** update validation response type for guest creation ([9ae731b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/9ae731b295fa620156e213bfddd76b1c79ded978))


### 🔧 Chores

* **dependencies:** clean up package-lock.json and yarn.lock ([3ec3ff4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/3ec3ff4d8ac9a3775058f1073bf54c96dcf580b3))
* **dependencies:** update package versions and add new dependencies ([cb1fc51](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cb1fc513d8dab34bd86814b081f8bc05be6ccccc))
* **dependencies:** update package-lock and yarn.lock for dependency upgrades ([0c576bc](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0c576bc72bbadc25795f4fe67a000ad95f396bc4))

## [1.12.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.11.0...v1.12.0) (2025-11-05)


### 🔧 Chores

* add .prettierignore to exclude CHANGELOG.md from formatting ([0de3cf7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0de3cf70cdb7eb517f704cfeea409fc039cde596))


### ✨ Features

* **auth, users:** add comprehensive error response DTOs for authentication and user management ([32f8524](https://github.com/The-Kodi-Suite/kodi.microservices/commit/32f85242dae314b382c6feab1262274a2ee75682))
* **auth, users:** add new response DTOs for authentication and user management ([6cbafe7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6cbafe76491f0c869b35435ecb1dfe479c927ff6))
* **auth, users:** update API response types for improved clarity ([fe52172](https://github.com/The-Kodi-Suite/kodi.microservices/commit/fe521726970da8cfb188398dced24ff36ed7cca4))
* **interceptors:** add TransformInterceptor to Auth and Users modules ([4f11c22](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4f11c225bbbd8dcb131e94791023fc1947f33544))


### ♻️ Code Refactoring

* **auth, users:** replace ApiErrorResponseDto with specific error response DTOs ([f13a9da](https://github.com/The-Kodi-Suite/kodi.microservices/commit/f13a9dae0181c0ed226982dc55c99f6a27e09b79))

## [1.11.0](https://github.com/The-Kodi-Suite/kodi.microservices/compare/v1.10.0...v1.11.0) (2025-11-05)


### 🔧 Chores

* **prisma:** remove deprecated Prisma schema files and migration scripts ([1ba22f7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1ba22f76b8b3c3a88191ea971eabf8557e917345))


### 🐛 Bug Fixes

* **auth, users, nginx:** update Swagger documentation endpoint and enhance Nginx configuration ([a9ec258](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a9ec258535f1517b6bf8be40561a26aa5cd4fd46))
* **caddy, nginx:** update API route prefixes for services ([6437a55](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6437a5586d071f14852dd552d372a8b40b6a2873))
* **prisma:** update schema paths in migration and generation scripts ([6c462a3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6c462a39fd1661451af54d0c8302e69d8dca02bb))
* update email addresses in configuration files ([39e09fd](https://github.com/The-Kodi-Suite/kodi.microservices/commit/39e09fd9c6d0322f258b31a511c3e79a6fc6b5a2))


### ♻️ Code Refactoring

* **controllers:** remove route prefixes from multiple controllers ([50efa4e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/50efa4e2712e42b2243632610a7ff5cc3d3e482d))
* **docker:** streamline Dockerfile for Prisma client generation and build process ([4ef980d](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4ef980dceef45803dfe3017a380daaa49a8821dc))
* **microservices:** standardize RabbitMQ microservice connection configuration ([165a763](https://github.com/The-Kodi-Suite/kodi.microservices/commit/165a7630f989da0b71c5c049f588de95b1675494))
* **rabbitmq:** restructure RabbitMQ module and configuration ([5c1d2bf](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5c1d2bfeb70b162ab2d441d57416802698054b44))
* **rabbitmq:** update RabbitMQ integration to use RmqModule ([65fa6f7](https://github.com/The-Kodi-Suite/kodi.microservices/commit/65fa6f79c75ee8ad2fadc0dee1cf27abfdfe5e72))


### ✨ Features

* **api:** add ENABLE_API_GATEWAY_PREFIX for Swagger configuration ([a85e56b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/a85e56b861b45e5818784043511cb87f0ec4c1d7))
* **auth, users, nginx:** add API server endpoints and enhance Nginx configuration ([ddc6429](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ddc6429df20d4b28fa162876d859852d6452ce3a))
* **auth, users:** add username support in login and registration DTOs ([4d7a077](https://github.com/The-Kodi-Suite/kodi.microservices/commit/4d7a07715c922ee701f6dac766038db2e6dc26df))
* **auth, users:** enhance API response documentation with error handling details ([2ca5e5f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/2ca5e5f7542293f3dcd556495e2068a6c55fd391))
* **auth, users:** improve user authentication and registration flow ([6c448c2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/6c448c21c660d1eb0ac982fd159144348db6b783))
* **auth, users:** support username login and enhance user registration ([bb9c19e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/bb9c19e78a3efb20380e708ec6df2ac8089573db))
* **auth:** enhance login documentation and examples for clarity ([ba94d1b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/ba94d1b8c30c7919efb53f0c913891f9dd15f6ad))
* **caddy:** add Caddy reverse proxy configuration with automatic SSL support ([835bb0e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/835bb0e715a9133c89747caae0ba084f99b8eb26))
* **caddy:** enhance Caddy configuration for dynamic Caddyfile generation ([093b146](https://github.com/The-Kodi-Suite/kodi.microservices/commit/093b146d21dca8d330ee43a95d9b7c73e88cb3f1))
* **docker:** add sequential build script and optimize Docker Compose configuration ([1ece1b4](https://github.com/The-Kodi-Suite/kodi.microservices/commit/1ece1b479d0cb199cf7e6df8de6cbabe97a04304))
* **docker:** enhance Docker commands in package.json ([99a5b5b](https://github.com/The-Kodi-Suite/kodi.microservices/commit/99a5b5b516c8c24efefdc22433b92533e516d156))
* **docker:** enhance Dockerfile for Prisma compatibility and build optimization ([5ddb08e](https://github.com/The-Kodi-Suite/kodi.microservices/commit/5ddb08e7c4aa1500c90414be8063acf347e888fc))
* **docker:** update Dockerfile and Prisma schemas for enhanced compatibility ([0f26989](https://github.com/The-Kodi-Suite/kodi.microservices/commit/0f26989d1b121fd8745afb0d3d4a269270b641c4))
* **docker:** update Dockerfile for improved dependency management and build process ([cdf24af](https://github.com/The-Kodi-Suite/kodi.microservices/commit/cdf24af9c32f99b1799bc0c9172ed71dbdb7ec2f))
* **docker:** update RabbitMQ and Docker Compose configurations ([15e2982](https://github.com/The-Kodi-Suite/kodi.microservices/commit/15e29827845c5c5617716c3d7382a78024ba3938))
* **env:** add environment configuration and update Docker Compose for monitoring ([906c8fa](https://github.com/The-Kodi-Suite/kodi.microservices/commit/906c8faa4da5841210bb83c6769d93d8177924d8))
* **nginx, scripts:** enhance Nginx configuration and improve database URL handling ([c775ff2](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c775ff2754b889d9da74996bcd56edc2c3b2194b))
* **pm2:** add ecosystem configuration for PM2 process management ([fe18eb3](https://github.com/The-Kodi-Suite/kodi.microservices/commit/fe18eb32f048fc7519957f63e4b15d841f7d4d2b))
* **prisma:** add initial migration scripts for Admin, Auth, City, Core, Integration, Notification, Scheduler, and Users schemas ([04ed67f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/04ed67fbc699b88387f0b870b9243bb9265bee6a))
* **prisma:** add new Prisma schemas and migration scripts for microservices ([b6b931f](https://github.com/The-Kodi-Suite/kodi.microservices/commit/b6b931fdb908bc45e07b5ac63e246c28816dafc4))
* **prisma:** enhance database URL handling in migration script ([d2f947a](https://github.com/The-Kodi-Suite/kodi.microservices/commit/d2f947a70b374eada9a49c17096d77c0dfb0fadc))
* **rabbitmq:** introduce RmqClientWrapper for dynamic message routing ([3974682](https://github.com/The-Kodi-Suite/kodi.microservices/commit/397468218755a016294b6f253b0ea43e352a49c9))
* **rabbitmq:** update RabbitMQ configuration for environment variable support ([c1caad8](https://github.com/The-Kodi-Suite/kodi.microservices/commit/c1caad8a8be6f353618339f520d6698377566b07))

## [1.10.0](///compare/v1.9.0...v1.10.0) (2025-11-03)

### ✨ Features

- **logging:** enhance logging for message processing in Core and Users controllers e52d3d4
- **rabbitmq:** enhance RabbitMQ queue options across applications 16e3340

## [1.9.0](///compare/v1.8.0...v1.9.0) (2025-11-03)

### 🐛 Bug Fixes

- **errors:** improve error handling and messaging in GlobalExceptionFilter 34df8f7

### ✨ Features

- **config:** enhance service configuration with database settings and RabbitMQ improvements 6a87024
- **core:** implement CoreMessageController for RabbitMQ message handling 7107478
- **database:** implement database connection handling and logging for services d967f4a
- **microservices:** integrate RabbitMQ microservice support across applications 021319e
- **users:** add UsersMessageController for RabbitMQ message handling e9e2cee

### 🔧 Chores

- **dependencies:** update package.json and yarn.lock to include axios and @nestjs/axios 076c64e
- **env:** update environment configuration and enhance security 982a133
- **translations:** remove trailing whitespace in JSON translation files a90480d

## [1.8.0](///compare/v1.7.0...v1.8.0) (2025-11-03)

### 🐛 Bug Fixes

- improve context logging in LoggerService f9854a3

### ♻️ Code Refactoring

- enhance authentication flow with IP and user agent logging 95033aa
- integrate Saga pattern into AuthService for distributed transactions a3e9ff2
- replace Logger with LoggerService in multiple services for improved logging 80833f0
- update ConfigModule imports across applications 42b25cc

### ✨ Features

- add contracts library configuration and path mappings 4b9f7a4
- add DTOs for user and authentication management 8a4cd28
- add internationalization support with language decorators and translation files d6b55d4
- add JWT authentication and user profile management endpoints 36230c6
- add saga DTOs for managing saga workflows 088954c
- add saga library configuration and path mappings ea29786
- add Swagger documentation to authentication DTOs c046e54
- **config:** enhance configuration management and service ports 0cb937f
- enhance session management with new endpoints and service methods d034e3d
- enhance Swagger documentation for user management endpoints 2bc6e05
- enhance user DTOs with Swagger documentation af8e848
- **errors:** integrate I18nService into GlobalExceptionFilter for enhanced error messaging ab4e896
- **i18n:** add i18n library configuration and update TypeScript paths babf1f1
- **i18n:** add internationalization configuration and update documentation e780924
- **i18n:** integrate I18nModule and LanguageInterceptor across multiple applications 1ecbd47
- implement i18n module for internationalization support 23a88f9
- integrate Swagger documentation for authentication endpoints d75aea1
- introduce Saga Orchestrator library for managing distributed transactions 42d4524
- **swagger:** update Swagger titles for Auth and Users services bda2ca6
- **validation:** enhance ValidationInterceptor with I18nService for localized error messages b7838f1

## [1.7.0](///compare/v1.6.0...v1.7.0) (2025-11-03)

### ♻️ Code Refactoring

- comment out unused terminal module exports in index.ts af25618
- enhance ConfigService get method and clean up JWT strategy permissions retrieval d2628bc
- improve user role handling and permissions retrieval in AuthService 42016bb
- remove permissions generation and migration scripts 825900b
- remove Prisma permissions module and update JWT handling 04fb440
- remove unused permissions module and related exports f045cd3
- simplify imports and formatting in RBAC-related files d6d6185
- update interceptor and logger initialization across multiple modules 843a1fe

### ✨ Features

- add new Prisma aliases for admin, terminal, and permissions modules in tsconfig 938ad30
- add user registration functionality and enhance user management 91fdc88
- implement city management and access guards for RBAC 0d6a76b
- introduce city hierarchy service and enhance RBAC with city management features 59c3582

## [1.6.0](///compare/v1.5.0...v1.6.0) (2025-11-03)

### ✨ Features

- add permissions module and service for permissions management bb9e55c
- add permissions schema generation and migration to scripts 7f0dc26
- add tenancy and RBAC libraries to project configuration 0243329
- add tenancy module with city context management and guards c4babec
- enhance auth module with city admin assignment and user city retrieval c2d547d
- enhance JWT module and service with city and permissions support 9b622b5
- implement RBAC module with guards and services for role-based access control edf80b3

### 🐛 Bug Fixes

- downgrade @types/node version to 24.10.0 in package.json and update yarn.lock a53001e

### 📚 Documentation

- expand README with platform overview, user roles, and core features c41996f

## [1.5.0](///compare/v1.4.1...v1.5.0) (2025-11-02)

### ✨ Features

- add terminal module and service for terminal management 6980a85
- add terminal service configuration and metrics scraping 148a13d
- add terminal service configuration to Docker and environment setup c2b1ec8
- implement terminal service with core functionality 93e7aaa
- update scripts to include terminal service in production setup dd143f1

### ♻️ Code Refactoring

- comment out terminal service configurations in Nginx, Prometheus, and database initialization 32a75bd
- comment out terminal service in Docker configuration and update development scripts e92fa11
- update service configurations to exclude terminal service b7565a4
- update terminal service implementation and documentation 699d867

### [1.4.1](///compare/v1.4.0...v1.4.1) (2025-11-01)

### ✨ Features

- update scripts to include admin service in production setup dca548e

## [1.4.0](///compare/v1.3.0...v1.4.0) (2025-11-01)

### ✨ Features

- add admin service configuration and database initialization 9a234fb
- add admin service to Docker Compose and environment configuration 8145f50
- add Prisma Admin module and service for admin management 25b5b49
- implement admin service with health checks and admin management f24ea43
- update Prisma scripts to include admin service 88c094a

## [1.3.0](///compare/v1.2.0...v1.3.0) (2025-11-01)

### ✨ Features

- add PostgreSQL auto-initialization and configuration documentation 77f3821
- add Redis Commander and monitoring exporters to Docker setup bfcd0eb
- enhance Docker Compose configuration for PostgreSQL initialization 32419ef
- enhance Grafana dashboards and Prometheus configuration 75f7242
- enhance production setup with initialization script and documentation updates fc2be4b
- update environment configuration for monitoring and administration tools 593e2f1

## [1.2.0](///compare/v1.1.0...v1.2.0) (2025-11-01)

### 🔧 Chores

- add .yarnrc.yml for node-modules linker and update VSCode settings 6d2aa6f

### ✨ Features

- implement comprehensive monitoring setup for KODI Microservices b587067

### ♻️ Code Refactoring

- update Dockerfile paths and Node.js version in configuration cf727a0

### 📚 Documentation

- update Node.js version in getting started and project overview documentation 44f8fdd

## [1.1.0](///compare/v1.0.1...v1.1.0) (2025-11-01)

### ✨ Features

- add Prisma client generation and migration scripts d7c352e

### 🔧 Chores

- remove unused package.json files and update VSCode settings 1911f0e

### ♻️ Code Refactoring

- restructure Prisma service modules and schemas 503f3aa
- update Prisma scripts and package.json for improved service management d26e974
- update Prisma service imports and restructure Dockerfile 1ac9f46
- update TypeScript configuration and service imports 0f15af1

### 🐛 Bug Fixes

- update type assertion for Prisma service connections 068822b

### 📚 Documentation

- add comprehensive release workflow guide f1a8f2d
- update getting started and project structure documentation 06198b2

### 1.0.1 (2025-10-30)

### 📚 Documentation

- add Commit Quick Reference and Contribution Guidelines 2626c65
- **env:** add .env.example, env.template and ENVIRONMENT_VARIABLES guide 373fa0b

### 🔧 Chores

- add configuration files for Commitizen and standard-version 97beb2c
- update .gitignore and CHANGELOG.md 4122914

## [1.0.0] - 2025-01-29

### Added

- Initial release of KODI microservices platform
- Complete monorepo structure with NestJS CLI
- Production-ready infrastructure setup
- Developer tooling and hot-reload support

---

## Version History

- **1.0.0** - Initial release (2025-01-29)

## How to Update This Changelog

When making changes, add them under the `[Unreleased]` section using these categories:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

Example:

```markdown
## [Unreleased]

### Added

- New email notification templates

### Fixed

- User registration validation bug
```

When releasing a new version:

1. Move items from `[Unreleased]` to a new version section
2. Add the version number and date
3. Update the version in `package.json`
4. Create a git tag
