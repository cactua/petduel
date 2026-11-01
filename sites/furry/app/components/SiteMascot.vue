<script lang="ts">
// Il sito furry non ha mascotte: prende il posto di Biscotto del nucleo e non mostra nulla.
// Le card da condividere fanno lo stesso perché brand.mascotSvg nel site.config.ts manca
export default defineComponent({
  inheritAttrs: false,
  props: { still: Boolean },
  render: () => null,
})
</script>
