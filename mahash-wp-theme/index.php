<?php get_header(); ?>
<div class="space-y-8">
    <header class="mb-8">
        <h1 class="text-3xl font-black text-white">آخرین گزارش‌ها و مقالات</h1>
        <p class="text-slate-400 mt-2">تازه‌ترین محتوای منتشر شده در سایت</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <?php
    if ( have_posts() ) :
        while ( have_posts() ) :
            the_post();
            ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('bg-[#23282d] border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-500 transition shadow-lg flex flex-col'); ?>>
                <?php if ( has_post_thumbnail() ) : ?>
                    <a href="<?php the_permalink(); ?>" class="aspect-video block bg-black overflow-hidden">
                        <?php the_post_thumbnail('large', array('class' => 'w-full h-full object-cover hover:scale-105 transition duration-500')); ?>
                    </a>
                <?php else: ?>
                    <div class="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <svg class="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                <?php endif; ?>
                
                <div class="p-6 flex flex-col flex-grow">
                    <header class="mb-4">
                        <div class="text-[10px] text-blue-400 font-mono mb-2"><?php echo get_the_date(); ?></div>
                        <h2 class="text-xl font-bold text-white mb-2">
                            <a href="<?php the_permalink(); ?>" class="hover:text-blue-400 transition">
                                <?php the_title(); ?>
                            </a>
                        </h2>
                    </header>
                    <div class="text-sm text-slate-300 line-clamp-3 mb-6">
                        <?php the_excerpt(); ?>
                    </div>
                    <div class="mt-auto pt-4 border-t border-slate-700 flex justify-between items-center">
                        <div class="text-xs text-slate-400">نویسنده: <?php the_author(); ?></div>
                        <a href="<?php the_permalink(); ?>" class="text-blue-400 hover:text-blue-300 text-xs font-bold">ادامه مطلب &larr;</a>
                    </div>
                </div>
            </article>
            <?php
        endwhile;
        the_posts_navigation(array('prev_text' => 'نوشته‌های قدیمی‌تر', 'next_text' => 'نوشته‌های جدیدتر', 'class' => 'mt-8 flex justify-between text-blue-400'));
    else :
        ?>
        <p class="text-slate-400">هیچ نوشته‌ای یافت نشد.</p>
        <?php
    endif;
    ?>
    </div>
</div>
<?php get_footer(); ?>
