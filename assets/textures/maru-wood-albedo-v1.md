# 체험마루 목재 바닥 텍스처 v1

생성 도구: OpenAI 내장 image_gen.
용도: 체험마루 바닥의 base-color/albedo 후보. 체험마루 바닥에 적용함.
광택은 조명으로 별도 표현. 반복용으로 생성했으나 반복 비율은 2.4×2.4 상대 단위이며 광택은 셰이더에서 별도 계산.

## 생성 프롬프트
Use case: photorealistic-natural. Asset type: square seamless tileable base-color/albedo texture for a WebGL museum wood floor. Create a flat orthographic directly overhead material scan filling every pixel, based on the reference described here: Korean museum activity hall floor of narrow long golden honey-brown varnished wooden boards, natural amber and yellow-brown variations between planks, fine longitudinal wood grain and occasional subtle dark streaks, slim dark joints, irregular staggered short end joints. About 16 narrow parallel board strips across the square, boards running vertically, varied lengths 4–10 times width, restrained realistic variation and lightly worn finish, not rustic or distressed. Seamless repeating opposite edges in both axes. Neutral completely uniform diffuse illumination; PURE ALBEDO no baked highlights, no specular reflections, no shadows, no ambient occlusion, no perspective, no vignette, no blur, no objects, no border, no text. Warm golden tone rather than red walnut or pale oak. High detail, preferably 2048x2048. This is one texture map, not a room rendering or material preview sphere.
