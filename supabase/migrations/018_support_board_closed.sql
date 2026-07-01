-- Permitir cierre de publicación por el autor

alter table support_board_posts
  drop constraint if exists support_board_posts_status_check;

alter table support_board_posts
  add constraint support_board_posts_status_check
  check (status in ('open', 'attended', 'closed'));

alter table support_board_posts
  add column if not exists closed_at timestamptz;
