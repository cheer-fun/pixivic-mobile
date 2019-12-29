<template>
  <transition enter-active-class="animated rollIn"
              leave-active-class="animated rollOut">
    <div class="search">
      <div class="search-header">
        <i class="iconfont icon-icon-test"
           @click="$router.back()"></i>
        <div class="input">
          <input v-model="value"
                 ref="input"
                 placeholder="(●'◡'●)ﾉ關鍵字の輸入"
                 @input="getKeyword"
                 @keyup.enter="enter(value)"
                 @focus="focus" />
          <i class="iconfont icon-xiangji1">
          </i>
          <div class="save">
            <!-- <label class="btn"
                   for="uploads">头像上传</label> -->
            <input type="file"
                   id="uploads"
                   accept="image/png, image/jpeg, image/gif, image/jpg"
                   @change="uploadImg($event)">
          </div>
        </div>
        <i class="iconfont icon-xuanxiang- menu"
           v-if="!isSearch"
           @click="showOptions"></i>
      </div>
      <div class="search-suggest"
           v-if="isSearch">
        <div class="suggest-item"
             v-for="(item, index) in keywords"
             :key="index">
          <div class="tag"
               @click="enter(item)">{{item}}</div>
          <i class="iconfont icon-jiantou-copy-copy-copy"></i>
        </div>
        <div v-show="value"
             class="suggest-btn">
          <cube-button :light="true"
                       @click="translateKeyword">翻译并搜索</cube-button>
        </div>
      </div>
      <div class="search-content"
           v-else>
        <!-- dom长列表优化版本 暂未实现 -->
        <!-- <cube-recycle-list :data="pictureList"
                           :size="30"
                           :on-fetch="onFetch"
                           :offset="100"
                           class="list">
          <template slot="item"
                    slot-scope="{ data }">
            <div :id="data.id"
                 class="item"
                 style="width: 50vw;"
                 @click="handleClick(data)">
              {{data.title}}
            </div>
          </template>
        </cube-recycle-list> -->
        <cube-scroll :data="pictureList"
                     :options="options"
                     ref="scroll"
                     class="scroll"
                     @pulling-up="onPullingUp">
          <Tags :data="tags"
                @handleClick="clickTag" />
          <Tags :data="exclusive"
                @handleClick="clickTag" />
          <List :list="pictureList" />
        </cube-scroll>
        <Loading v-if="loading" />
      </div>
      <search-options ref="options"
                      @searchFor="searchFor"></search-options>
    </div>
  </transition>
</template>

<script>
import debounce from 'lodash/debounce'
import Loading from '@/components/loading/Loading'
import List from '@/components/list/List'
import searchOptions from './options/Options'
import Tags from '@/components/tags/Tags'

export default {
  name: 'Search',
  components: {
    Loading,
    List,
    searchOptions,
    Tags
  },
  data () {
    return {
      value: '',
      isSearch: true,
      keywords: '',
      pictureList: [],
      noData: false,
      page: 1,
      tags: [],
      exclusive: [],
      optionsParams: null, // 设置的筛选条件
      loading: false
    }
  },
  computed: {
    options () {
      return {
        pullUpLoad: {
          threshold: 0,
          txt: { more: '上拉加载更多', noMore: '(￣ˇ￣)俺也是有底线的' },
          visible: false
        },
        scrollbar: true,
        probeType: 2
      }
    }
  },
  methods: {
    getKeyword: debounce(function () {
      this.$api.search.getKeyword(this.value).then(({ data: { data } }) => {
        this.keywords = data.keywordList
      })
    }, 500),
    initParam () {
      this.noData = false
      this.page = 1
      this.pictureList = []
    },
    enter (val) {
      if (!this.value) return
      this.initParam()
      this.value = val
      this.$refs.input.blur()
      this.isSearch = false
      this.getData()
      this.getTags(val)
      this.getExclusive(val)
    },
    getData (options = {}) {
      if (this.noData) {
        return this.$refs.scroll.forceUpdate()
      }
      // 避免上拉分页的时候出现全局loading
      if (this.page === 1) {
        this.loading = true
      }
      const param = {
        keyword: this.value,
        page: this.page++
        // xRestrict: 1,
        // maxSanityLevel: 10
      }
      const params = Object.assign(param, options)
      this.$api.search.getSearch(params).then(res => {
        if (!res.data.data.illustrations.length) {
          this.$refs.scroll.forceUpdate()
          this.noData = true
          this.loading = false
          return
        }
        this.pictureList = this.pictureList.concat(res.data.data.illustrations)
        this.loading = false
      })
    },
    getTags (param) {
      this.$api.search.getTags(param)
        .then(res => {
          this.tags = res.data.data
        })
    },
    getExclusive (param) {
      this.$api.search.getExclusive(param)
        .then(res => {
          this.exclusive = res.data.data
        })
    },
    focus () {
      this.isSearch = true
    },
    onPullingUp () {
      this.getData()
    },
    showOptions () {
      this.$refs.options.show()
    },
    translateKeyword () {
      this.$api.search.getTranslations(this.value)
        .then(res => {
          this.enter(res.data.data.keyword)
        })
    },
    searchFor (options) {
      this.optionsParams = options
      this.initParam()
      this.getData(options)
    },
    clickTag (val) {
      this.value = val.keyword
      this.tags = this.exclusive = []
      this.getTags(val.keyword)
      this.getExclusive(val.keyword)
      this.searchFor(this.optionsParams)
    },
    async uploadImg (e) {
      const file = e.target.files[0]
      if (!/\.(jpg|jpeg|png|webp|GIF|JPG|PNG)$/.test(e.target.value)) {
        this.$createDialog({
          type: 'alert',
          title: '请选择正确图片格式'
        }).show()
        return false
      }
      if (file.size > 1 * 1024 * 1024) {
        this.$createDialog({
          type: 'alert',
          title: '图片大小不能超过1M'
        }).show()
        return false
      }
      this.isSearch = false
      this.loading = true
      this.pictureList = [] // 清空下 不然会接着之前搜索的
      this.noData = true
      this.tags = this.exclusive = []
      let formData = new FormData()
      formData.append('file', e.target.files[0])
      const result = await this.$api.search.uploadImg(formData)
      const res = await this.$api.search.searchByImg(result.data.data)
      this.pictureList = res.data.data
      this.loading = false
    }
  },
  activated () {
    // ?
    this.$refs.scroll && this.$refs.scroll.refresh()
  }
  // beforeRouteLeave (to, from, next) {
  //   console.log('to', to)
  //   console.log('from', from)
  //   if (to.name === 'Detail' || to.name === 'Artist') {
  //     if (from.meta.noCache) {
  //       from.meta.noCache = false
  //     }
  //     this.$store.dispatch('addCachedView', this.$route)
  //     next()
  //   } else {
  //     from.meta.noCache = true
  //     this.$destroy()
  //     next()
  //   }
  // }
}
</script>

<style lang="stylus" scope>
.search
  position fixed
  top 0
  right 0
  bottom 0
  left 0
  background-color #ffffff
  z-index 100
  font-size 16px
  .search-header
    display flex
    align-items center
    justify-content space-between
    padding 12px 16px 16px
    box-sizing border-box
    >i
      flex-basis 40px
    .menu
      text-align right
    .input
      flex 1
      font-size 16px
      box-sizing border-box
      position relative
      >input
        // flex 1
        width 100%
        border none
        // font-size 16px
        box-sizing border-box
        height 40px
        padding 0 9px
        border-radius 5px
        background-color rgb(245, 245, 245)
        color rgb(31, 31, 31)
      >i
        position absolute
        top 12px
        right 5px
        &:after
          content ''
          position absolute
          top -10px
          right -10px
          bottom -10px
          left -10px
      .save
        position absolute
        width 40px
        height 40px
        top 0
        right 0
        opacity 0
        >input
          width 100%
          height 100%
  .search-suggest
    width 100%
    position absolute
    top 80px
    height 300px
    overflow scroll
    .suggest-btn
      position fixed
      top 370px
      left 0
      right 0
      margin auto
      width 50%
      height 40px
    .suggest-item
      width 100%
      padding 9px 12px 9px 16px
      display flex
      align-items center
      justify-content space-between
      box-sizing border-box
      .tag
        color #adadad
        font-size 16px
      i
        font-size 24px
        position relative
        &:after
          content ''
          position absolute
          top -10px
          right -10px
          bottom -10px
          left -10px
  .search-content
    width 100%
    position absolute
    top 80px
    bottom 0
    left 0
    // 要在这里设置样式 组件内无效
    .scroll
      .horizontal-scroll
        .cube-scroll-content
          display inline-block
</style>