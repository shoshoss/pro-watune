FROM ruby:3.3.0
ENV LANG C.UTF-8
ENV TZ Asia/Tokyo

# 基本的なパッケージのインストール
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg wget vim yasm pkg-config \
    && mkdir -p /etc/apt/keyrings \
    # Node.js のセットアップ
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && NODE_MAJOR=21 \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    # Yarn のセットアップ
    && curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor -o /etc/apt/keyrings/yarn.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/yarn.gpg] https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get update -qq \
    && apt-get install -y --no-install-recommends build-essential libpq-dev libssl-dev nodejs yarn \
       libmp3lame-dev libvorbis-dev libopus-dev \
    && rm -rf /var/lib/apt/lists/*

# FFmpegのインストール（LGPL準拠）
WORKDIR /tmp
RUN wget https://ffmpeg.org/releases/ffmpeg-7.0.1.tar.gz \
    && tar xzf ffmpeg-7.0.1.tar.gz \
    && cd ffmpeg-7.0.1 \
    && ./configure --enable-static --disable-shared --disable-debug --disable-doc --disable-ffplay --disable-ffprobe \
       --enable-libmp3lame --enable-libvorbis --enable-libopus \
    && make -j$(nproc) \
    && make install \
    && make clean \
    && rm -rf /tmp/ffmpeg-7.0.1*

# 不要なビルドツールの削除
RUN apt-get remove --purge -y build-essential && apt-get autoremove -y && apt-get clean

# アプリケーションのセットアップ
RUN mkdir /app
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN gem install bundler:2.5.7 && \
    bundle install
COPY . /app
