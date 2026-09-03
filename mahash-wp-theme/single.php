<?php get_header(); ?>
<?php
while ( have_posts() ) :
    the_post();
    ?>
    <article id="post-<?php the_ID(); ?>" <?php post_class('max-w-4xl mx-auto bg-[#23282d] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl'); ?>>
        <?php if ( has_post_thumbnail() ) : ?>
            <div class="aspect-video w-full bg-black">
                <?php the_post_thumbnail('full', array('class' => 'w-full h-full object-cover')); ?>
            </div>
        <?php endif; ?>
        
        <div class="p-6 sm:p-10">
            <header class="mb-8 border-b border-slate-700 pb-8">
                <div class="flex items-center gap-4 text-xs text-slate-400 mb-4 font-mono">
                    <span><?php echo get_the_date(); ?></span>
                    <span>•</span>
                    <span><?php the_author(); ?></span>
                </div>
                <h1 class="text-3xl sm:text-4xl font-black text-white leading-tight">
                    <?php the_title(); ?>
                </h1>
            </header>

            <div class="prose prose-invert prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-400">
                <?php the_content(); ?>
            </div>
            
            <?php
            $video_url = get_post_meta( get_the_ID(), 'video_url', true );
            if ( ! empty( $video_url ) ) :
            ?>
                <div class="mt-10 pt-8 border-t border-slate-700">
                    <h3 class="text-lg font-bold text-white mb-4">ویدیو پیوست شده:</h3>
                    <div class="aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-700">
                        <video src="<?php echo esc_url($video_url); ?>" controls class="w-full h-full"></video>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </article>
    <?php
endwhile;
?>
<?php get_footer(); ?>
