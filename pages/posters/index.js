const app = getApp()
Page({
	data: {
		bgSrc: '../../assets/posters.png', //背景
		headPortrait:'../../assets/head_portrait.jpg', //头像
		qrcode:'../../assets/qrcode.jpg', //二维码
	},
	onReady() {
		const query = wx.createSelectorQuery()
		query.select('#myCanvas')
			.fields({
				node: true,
				size: true
			}).exec((res) => {
				const canvasDom = res[0] 
				const canvas = canvasDom.node
				const ctx = canvas.getContext('2d')
				const dpr = wx.getSystemInfoSync().pixelRatio
				this.setData({
					canvasDom,
					canvas,
					ctx,
					dpr
				},()=>{
					this.drawing()
				})
			})
	},
	// 绘制画面 
	drawing() {
		const that = this;
		wx.showLoading({ title: "生成中..." }) // 显示loading
		that.drawPoster()               // 绘制海报
		.then(function () { 
			that.drawPhoto() // 绘制头像
			that.drawQrcode() // 绘制推荐码
			setTimeout(()=>{
				wx.canvasToTempFilePath({ //将canvas生成图片
					canvas:that.data.canvas,
					fileType:'jpg',
					quality:1,
					success(res) {
						that.setData({ imgFilePath: res.tempFilePath })
					},
					fail(err) {
						console.log('生成图片失败：', err)
					},
				}, this)
				wx.hideLoading() // 隐藏loading
				wx.showToast({
					title: '生成成功，长按保存！',
					icon:'none'
				})
			}, 1000)
		})
	},
	// 绘制海报背景
	drawPoster() {
		const that = this
		return new Promise((resolve, reject)=> {
			let poster = that.data.canvas.createImage();          // 创建一个图片对象
			poster.src = that.data.bgSrc                      // 图片对象地址赋值
			poster.onload = () => {
				that.setData({
					width:poster.width + 'rpx',
					height:poster.height  + 'rpx'
				})
				that.computeCanvasSize(poster.width, poster.height) // 计算画布尺寸
				.then((res)=>{
					that.data.ctx.drawImage(poster, 0, 0, poster.width, poster.height, 0, 0, res.width, res.height);
					resolve()
				})
			}
		})
	},
	// 计算canvas大小
	computeCanvasSize(imgWidth, imgHeight){
    const that = this
    return new Promise((resolve, reject)=>{
      var canvasWidth = that.data.canvasDom.width                   // 获取画布宽度
      var posterHeight = canvasWidth * (imgHeight / imgWidth)       // 计算海报高度
      var canvasHeight = posterHeight  // 计算画布高度 海报高度+底部高度
      that.setData({
        canvasWidth: canvasWidth,                                   // 设置画布容器宽
        canvasHeight: canvasHeight,                                 // 设置画布容器高
        posterHeight: posterHeight                                  // 设置海报高
      }, () => { // 设置成功后再返回
        that.data.canvas.width = that.data.canvasWidth * that.data.dpr // 设置画布宽
        that.data.canvas.height = canvasHeight * that.data.dpr         // 设置画布高
        that.data.ctx.scale(that.data.dpr, that.data.dpr)              // 根据像素比放大
        setTimeout(()=>{
          resolve({ "width": canvasWidth, "height": posterHeight })    // 返回成功
        }, 1200)
      })
    })
	},
	// 绘制头像
  drawPhoto() {
		let photoWidth = 67;
		let marginLeft = 146;
    let photo = this.data.canvas.createImage();       // 创建一个图片对象
		photo.src = this.data.headPortrait; // 图片对象地址赋值
    photo.onload = () => {
      let radius = photoWidth / 2                      // 圆形头像的半径
      let x = marginLeft / 2                    // 左上角相对X轴的距离
			let y = this.data.canvasHeight - photoWidth - 230 // 左上角相对Y轴的距离 ：整体高度 - 头像直径 - 微调
      this.data.ctx.save()
      this.data.ctx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI) // arc方法画曲线，按照中心点坐标计算，所以要加上半径
      this.data.ctx.clip()
			this.data.ctx.drawImage(photo, x, y, photoWidth, photoWidth)
      this.data.ctx.restore();
    }
	},
	// 绘制推荐码
	drawQrcode(){
		let photoWidth = 45;
		let marginLeft = 337;
		let photoNode = this.data.canvas.createImage();
		photoNode.src = this.data.qrcode;
		photoNode.onload = () => {
      let x = marginLeft / 2                    // 左上角相对X轴的距离
			let y = this.data.canvasHeight - photoWidth - 120 // 左上角相对Y轴的距离 ：整体高度 - 头像直径 - 微调
			this.data.ctx.drawImage(photoNode, x, y, photoWidth, photoWidth)
      this.data.ctx.restore();
    }
	},
	// 保存图片
	handlePhotoSave(){
		let imgFilePath = this.data.imgFilePath;
		wx.saveImageToPhotosAlbum({
			filePath:imgFilePath,
			success(){
				wx.showToast({
					title: '保存成功！',
				})
			},
			fail(err){
				if(err.errMsg == "saveImageToPhotosAlbum:fail auth deny"){
					wx.showModal({
						title:'提示',
						content:'需先打开图片保存授权',
						success(res){
							if(res.confirm){
								wx.openSetting({
									success:res=>{
										if(res.authSetting['scope.writePhotosAlbum']){
											wx.saveImageToPhotosAlbum({
												filePath: imgFilePath,
												success(res){
													wx.showToast({
														title: '保存成功！'
													})
												}
											})
										}else{
											wx.showToast({
												title: '授权失败，请重新授权。',
												icon:'none'
											})
										}
									}
								})
							}
						}
					})
				}
			}
		})
	},
})